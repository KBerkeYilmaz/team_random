// lib/env.ts
// Phase 2 (issue #96): the single, server-only source of truth for environment
// variables — validated once with Zod, fail-fast at import time.
//
// WHY THIS EXISTS
// Before Phase 2, env vars were read as raw `process.env.*` at their point of
// use, several behind hardcoded fallbacks scattered across the codebase (the
// contact base URL fell back to "http://localhost:3000", the IMAP host/port to
// "imap.gmail.com"/993, the bcrypt cost to a literal 10). A missing or malformed
// var therefore failed deep, late, and with a confusing message. Parsing here —
// eagerly, in one place — turns that into a single readable error at boot/build,
// and hands every consumer a typed `env` object instead of `string | undefined`.
//
// WHY A `typeof window` GUARD INSTEAD OF THE `server-only` PACKAGE
// `lib/auth.ts` imports this module (locked Phase 2 decision: auth sources
// MONGO_URI / SALT_ROUNDS from here). Phase 1 deliberately kept the auth module
// importable from plain tooling — the `tsx` migration script and, later, Vitest
// tests — with no top-level await and no bundler-only imports. The `server-only`
// npm package throws whenever it is imported outside a React-Server-Components
// bundle (i.e. under plain Node / tsx), which would regress that property. This
// `typeof window` check is a no-op on the server (Node and RSC alike) and throws
// only if the module is ever pulled into a browser bundle — the boundary we
// actually care about — while staying tsx/test-safe and dependency-free. (The
// non-NEXT_PUBLIC_ secrets below are never inlined into the client bundle by
// Next either way, so the guard signals misuse rather than guarding a leak.)
import { z } from "zod";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/env.ts is server-only and must never be imported into client-side code.",
  );
}

// Every environment variable the app relies on. The four with no explicit
// `process.env` read elsewhere (BETTER_AUTH_SECRET / BETTER_AUTH_URL, consumed
// inside Better Auth; EDGE_STORE_ACCESS_KEY / EDGE_STORE_SECRET_KEY, consumed
// inside EdgeStore) are still validated here so a missing one fails fast at boot
// with a clear message instead of surfacing deep inside a third-party call.
const envSchema = z.object({
  MONGO_URI: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  APP_EMAIL: z.string().min(1),
  APP_PASSWORD: z.string().min(1),
  EDGE_STORE_ACCESS_KEY: z.string().min(1),
  EDGE_STORE_SECRET_KEY: z.string().min(1),
  // Optional-with-defaults: each default reproduces the exact hardcoded fallback
  // this module replaces, so behaviour is unchanged when the var is unset.
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  IMAP_HOST: z.string().min(1).default("imap.gmail.com"),
  IMAP_PORT: z.coerce.number().int().positive().default(993),
  SALT_ROUNDS: z.coerce.number().int().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Aggregate every failing var into one readable list rather than throwing on
  // the first — a misconfigured deployment is then diagnosable at a glance.
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
