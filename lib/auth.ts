// lib/auth.ts
// Better Auth server instance — replaces next-auth v4 (Phase 1, issue #87).
//
// AUDIT #87: The auth engine moves from next-auth (lib/authOptions.js, JWT
// sessions) to Better Auth over the SAME MongoDB. We reuse the single Mongoose
// connection pool as the source of the native driver `Db`/`MongoClient` that
// Better Auth's mongodbAdapter requires — so there is no second connection or
// credential set. Existing bcrypt password hashes are preserved via a custom
// hash/verify pair (no forced reset), and role-based admin access is enforced
// server-side by the admin plugin.
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "@/lib/database";

// Salt rounds preserved from the legacy flow (a literal 10 in
// app/api/user/route.js and actions/userActions.js). Phase 2 moves this into a
// Zod-validated env module (lib/env.ts).
const SALT_ROUNDS = 10;

// Better Auth's mongodbAdapter needs a resolved native `Db` at construction
// time. `mongoose.connection.db` is only populated once the connection opens,
// so we ensure the pool is connected first. Phase 2 formalizes this as a global
// cached-connection promise; here we simply await the existing connectDB once.
await connectDB();

const db = mongoose.connection.db;
const client = mongoose.connection.getClient();

if (!db) {
  throw new Error(
    "lib/auth.ts: Mongoose connection has no `db` — connectDB() did not resolve before Better Auth initialization.",
  );
}

export const auth = betterAuth({
  // Reuse the Mongoose pool's native driver handles — one connection, one pool.
  database: mongodbAdapter(db, { client }),
  // Session parity with the legacy next-auth config (1-hour expiry).
  session: {
    expiresIn: 60 * 60, // 1 hour
  },
  emailAndPassword: {
    enabled: true,
    // Preserve existing bcrypt hashes so migrated users keep their passwords.
    password: {
      hash: (password) => bcrypt.hash(password, SALT_ROUNDS),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
  plugins: [
    // Server-side role enforcement. The legacy `role` is carried into Better
    // Auth's `user.role` by scripts/migrate-to-better-auth.ts; the admin plugin
    // surfaces it and gates admin-only operations. Default new users to "user".
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    // nextCookies() MUST be last (Better Auth Next.js cookie handling).
    nextCookies(),
  ],
});
