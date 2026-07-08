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
// credential set) but opens its own pool. Reusing Mongoose's connection to avoid
// a second pool would require a top-level await (Mongoose's `connection.db` is
// undefined until connected), which breaks the CJS/tsx tooling. Phase 2 evaluated
// consolidating the two pools and DEFERRED it for exactly that reason; both pools
// now at least read the URI from the same validated source (lib/env.ts). See
// docs/migration/phase2/db-env-hardening.md.
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import { env } from "@/lib/env";

// The native driver connects lazily on first operation — no await required.
// MONGO_URI and SALT_ROUNDS (below) now come from the Zod-validated env module
// (lib/env.ts, Phase 2) instead of a raw process.env read and a literal 10. env.ts
// has already guaranteed MONGO_URI is a non-empty string, so the previous local
// null-check here is redundant and has been dropped.
const client = new MongoClient(env.MONGO_URI);
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
      hash: (password) => bcrypt.hash(password, env.SALT_ROUNDS),
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
