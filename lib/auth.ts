// lib/auth.ts
// Better Auth server instance — replaces next-auth v4 (Phase 1, issue #87).
//
// AUDIT #87: The auth engine moves from next-auth (lib/authOptions.js, JWT
// sessions) to Better Auth over the SAME MongoDB. Better Auth uses a dedicated
// native MongoClient — its mongodbAdapter needs a native driver `Db`, not a
// Mongoose model, and the driver connects lazily on first use, so this module
// needs no top-level await and stays CJS/ESM-tooling-safe (tsx, tests, build).
// Existing bcrypt password hashes are preserved via a custom hash/verify pair
// (no forced reset); role-based admin access is enforced by the admin plugin.
//
// NOTE: This points at the same MONGO_URI as Mongoose (one database, one
// credential set) but opens its own pool. The original plan reused Mongoose's
// connection to avoid a second pool; that required a top-level await (Mongoose's
// `connection.db` is undefined until connected), which breaks CJS tooling. Phase
// 2 (DB/env hardening) can consolidate pooling; kept simple and robust here.
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

// Salt rounds preserved from the legacy flow (a literal 10 in
// app/api/user/route.js and actions/userActions.js). Phase 2 moves this into a
// Zod-validated env module (lib/env.ts).
const SALT_ROUNDS = 10;

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("lib/auth.ts: MONGO_URI is not set.");
}

// The native driver connects lazily on first operation — no await required.
const client = new MongoClient(uri);
const db = client.db();

export const auth = betterAuth({
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
