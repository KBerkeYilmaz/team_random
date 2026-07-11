# Phase 2 — Database & Env Hardening

**Status: ✅ Shipped** (PR #97, closes #96) — part of epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81).

Hardens the data/env layer: a cached Mongo connection, one Zod-validated env source of truth, `.lean()` data-fetch hygiene, and a focused server-layer log cleanup. No behaviour change for users — env defaults reproduce the exact fallbacks the code used before.

## Problems this phase fixes

- **`lib/database.js` had no connection caching** — it called `mongoose.connect()` on *every* server-action invocation, and on failure called `process.exit(1)`, a hard process kill that is catastrophic under serverless/Next.js (it tears down the whole worker instead of failing one request).
- **Raw `process.env.*` reads with hardcoded fallbacks** scattered across the code: `emailAction`'s base URL (`… || "http://localhost:3000"`, ×2), `"imap.gmail.com"`/`993` in both email routes, and a literal `SALT_ROUNDS = 10` in `lib/auth.ts`. Nothing validated them, so a missing var failed deep and unclearly.
- **Verbose / inconsistent data fetches**: `getMembers`/`getMember` hand-copied every schema field; `getWorks` did the same and silently omitted fields; `getWork` returned the **raw hydrated Mongoose document** across the RSC boundary.
- **Server/data-layer `console.log` debug noise** in the member/work actions and the works detail page.

## What changed

### `lib/env.ts` *(new)* — one validated source of truth
Server-only module that parses `process.env` **once**, eagerly, with Zod, and throws a single readable aggregated list on failure:

```
Invalid environment variables:
  - MONGO_URI: Required
  - BETTER_AUTH_URL: Required
  …
```

Validates every var the app relies on — including the four consumed *inside* their libraries (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` for Better Auth; `EDGE_STORE_ACCESS_KEY`/`EDGE_STORE_SECRET_KEY` for EdgeStore) so a missing one fails fast at boot rather than deep inside a third-party call. `NEXT_PUBLIC_API_BASE_URL`, `IMAP_HOST`, `IMAP_PORT`, and `SALT_ROUNDS` have defaults that reproduce the former hardcoded fallbacks exactly.

**Server boundary — why a `typeof window` guard, not the `server-only` package.** `lib/auth.ts` imports this module (below), and Phase 1 deliberately kept the auth chain importable under plain tooling (the `tsx` migration script and, later, Vitest tests) — no top-level await, no bundler-only imports. The `server-only` npm package *throws whenever it is imported outside a React-Server-Components bundle* (i.e. under plain Node/tsx), which would regress that property. The zero-dep `typeof window` check is a no-op on the server (Node and RSC) and throws only if the module is ever pulled into a browser bundle — the boundary we actually care about — while staying tsx/test-safe and dependency-free. (Non-`NEXT_PUBLIC_` secrets are never inlined into the client bundle by Next anyway, so the guard signals misuse rather than guarding a leak.) The plan listed both options; this is the accepted-alternative one, chosen for the reason above.

### `lib/database.ts` *(rename `.js` → `.ts`)* — cached connection
Global-cached-**promise** pattern: `cached.conn`/`cached.promise` live on `globalThis` so concurrent requests and dev hot-reloads reuse one connection, and parallel callers arriving during the initial connect all await the same in-flight attempt. On failure it **resets the cached promise and throws** (so the next call retries) instead of `process.exit(1)`. Reads `env.MONGO_URI`. Both importers (`memberAction`, `workAction`) already use `import connectDB from "@/lib/database"`, so the rename is transparent.

### `lib/auth.ts` — source from env
`new MongoClient(env.MONGO_URI)` and `bcrypt.hash(password, env.SALT_ROUNDS)` instead of a raw `process.env.MONGO_URI` read and a literal `10`. The local `if (!uri) throw` null-check is dropped as redundant (env.ts already guarantees a non-empty string). The pool-consolidation `NOTE` now records that Phase 2 **evaluated and deferred** merging the Better Auth (native `MongoClient`) and Mongoose pools.

### Email layer — kill hardcoded fallbacks
`actions/emailAction.js`, `app/api/email/route.js`, `app/api/email/count/route.js` route their base URL, IMAP host/port, and Gmail credentials through `env.*`. `secure: true` is left as-is. Behaviour is identical (defaults == former fallbacks) but a misconfigured var now fails fast.

### `actions/*` — `.lean()` data-fetch hygiene
- `getMembers` / `getMember`: `.lean()` + `{ _id, __v, ...rest }` → `{ id: _id.toString(), ...rest }`; identical field set to before. `getMember` now returns `null` when not found (`MemberDetails` already renders a loader on `null`) instead of dereferencing a null doc.
- `getWorks`: `.select("workTitle workGithubURL workAppURL workReadme workTechStack")` preserves the **exact** prior field set (still omits `workContributors`, `workImages`, timestamps) instead of a manual object literal.
- `getWork`: stops returning the raw hydrated doc; restores the string `id` (was the Mongoose `id` virtual) and defaults `workImages` to `[]` so `WorkDetails`' `work.workImages.length` never hits `undefined` (`.lean()` omits empty arrays).
- All four accept optional `{ skip, limit }` (`limit(0)` = no limit), so existing no-arg callers are unchanged.

**Contract preserved:** DataTables and the detail pages depend on the string `id`; `WorkDetails.jsx` calls `workImages.length`; `Date` timestamps stay RSC-serializable and pass through unchanged. `models/work.js`'s `workContributors` is intentionally untouched (Phase 3).

### Log cleanup (server/data layer only)
Catch-block `console.log(error)` → `console.error("<fn> failed:", error)` across the member/work getters and mutators; removed the validation-echo `console.log(validatedFields.error)`, the success `console.log(result)` echoes (and the now-dead `result` bindings they were the only consumer of), and `console.log(filteredWork)` in the works detail page. The two genuine `console.error`s in `emailAction` are kept. **Client-component form logs are deferred to Phase 8** (per the locked decision below).

## Decisions locked with the user

1. **The two Mongo pools stay separate** (Better Auth's native `MongoClient` + Mongoose). Consolidation was evaluated and **deferred**: merging needs a top-level `await` that breaks the `tsx`/test tooling (the same reason Phase 1 rejected it). Minimal hardening applied instead — **both** `lib/database.ts` and `lib/auth.ts` read the URI from `lib/env.ts`.
2. **Log cleanup = server/data layer only** (`actions/*`, `lib/database`, `app/api/email/*`, `emailAction`). Client-component logs → Phase 8.
3. **No `lib/logger.ts` now** (YAGNI). Recorded as a **Phase 4** tooling candidate in `plan.md`.

## Verification (build/run — no test infra until Phase 4)

- `npx tsc --noEmit` → clean (exit 0) on the new `.ts` and the whole strict project.
- `npm run build` → **exit 0**, full production build (17 routes, static pages 7/7). The logged `ESLint: Failed to load config "next/babel"` is the pre-existing broken lint config (Phase 4) and is non-fatal; the jose/Edge-Runtime warnings are pre-existing Better Auth artifacts.
- **Env fail-fast**: importing `lib/env.ts` with required vars unset throws the readable `Invalid environment variables:` list; with them set it parses and applies the `IMAP_HOST`/`IMAP_PORT`/`SALT_ROUNDS` defaults. Loads cleanly under plain `tsx` (confirms the guard keeps the auth chain tsx/test-safe).
- **Greps**: no `"use client"` file imports `@/lib/env`; the only raw `process.env` read left is the single intended one in `env.ts`; both DB importers keep the default import; zero `console.log` in the touched server files.

## Observed but intentionally out of scope (surfaced, not fixed here)

Per the "surface new concerns; don't smuggle them in" convention, findings noticed while working that a minimal Phase 2 diff should not touch:

- **`actions/workAction.js` wrong entity in messages**: `createWork`/`updateWork` catch logs say `"Failed to create work"` but their error returns read `Failed to create the member due to …` (copy-paste from `memberAction`); `updateWork`'s catch message also says "create". Cosmetic, pre-existing — leave for a dedicated fix or the Phase 3 TS pass.
- **Pre-existing unused `const result` bindings** in `workAction`'s `updateWork`/`deleteWork` (independent of logging) — Phase 3 (`noUnusedLocals`) territory.
- **`app/[locale]/about/page.jsx`** does `members?.map(...)`, which would throw if `getMembers` returned its `{ error }` shape — a fragility better addressed by Phase 8 error boundaries.
- **Edge-Runtime warnings** from `better-auth` → `jose` (`CompressionStream`/`DecompressionStream`) during build — a Phase 4 middleware-runtime concern, not Phase 2.

## Files touched

- `lib/env.ts` *(new)*, `lib/database.js` → `lib/database.ts`
- `lib/auth.ts`, `actions/emailAction.js`, `app/api/email/route.js`, `app/api/email/count/route.js`
- `actions/memberAction.js`, `actions/workAction.js`
- `app/[locale]/(dashboard)/dashboard/works/[id]/page.jsx`
- `docs/migration/{plan.md, README.md, phase2/db-env-hardening.md}`

## Follow-ups for later phases

- **Phase 3 (TypeScript):** migrate `actions/*` and `models/*` to `.ts`; the wrong-entity messages and unused bindings above get caught here.
- **Phase 4 (tooling/tests/CI):** fix the ESLint flat config (unblocks lint-in-build); decide on a `lib/logger.ts` abstraction; when tests import the auth surface, the `typeof window` guard keeps `lib/env.ts` importable under Vitest without a `server-only` alias.
- **Phase 8 (frontend polish):** client-component log cleanup; error boundaries around the `?.map` fragility.
