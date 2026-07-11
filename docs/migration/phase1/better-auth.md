<!--
Purpose: Document the Phase 1 auth migration (next-auth v4 -> Better Auth) of the
team-random modernization — what changed, why, and how it was verified. One doc
per phase lives under docs/migration/.
-->

# Phase 1 — Replace next-auth v4 with Better Auth

**Status:** Shipped — PR #88 (closes issue [#87](https://github.com/KBerkeYilmaz/team_random/issues/87))
**Epic:** [#81](https://github.com/KBerkeYilmaz/team_random/issues/81) — 7-phase modernization to 2026 best practices
**Date:** 2026-07-08
**Constraints:** Keep MongoDB + Mongoose for the domain models; **preserve existing bcrypt passwords** (no forced reset); enforce admin **server-side**; the new auth surface is written in **TypeScript** (an `allowJs` beachhead ahead of the Phase 3 TS sweep). Depends on Phase 0's server-side role derivation (#82/#83) so the swap does not reintroduce the privilege-escalation hole.

## Summary

The auth engine moves from **next-auth v4** (EOL; Credentials provider + JWT sessions) to **Better Auth** over the same MongoDB. Existing users keep their passwords — the legacy bcrypt hashes are carried across and verified by a custom hash/verify pair, so there is **no forced reset**. Role-based admin access is preserved and still enforced on the server (the admin plugin surfaces `session.user.role`; the dashboard layout remains the single enforcement chokepoint). The domain data layer (Mongoose models `member` / `work`) is untouched.

## What changed (one commit per concern)

| # | Commit | Change |
|---|---|---|
| 1 | `build(auth)` | Add `better-auth@1.6.23`, `mongodb@6.5.0` (pinned to match Mongoose's exact pin → one deduped driver), `typescript`, `@types/bcrypt`; convert `jsconfig.json` → `tsconfig.json` (allowJs beachhead, `target ES2022`). |
| 2 | `feat(auth)` + `fix(auth)` | `lib/auth.ts` (`betterAuth` + `mongodbAdapter`, bcrypt hash/verify, `admin` plugin, `nextCookies()` last), `lib/auth-client.ts` (`adminClient()`), `app/api/auth/[...all]/route.ts` (`toNextJsHandler`). The connection uses a dedicated `MongoClient` — see **Deviations**. |
| 3 | `refactor(auth)` | Repoint every **server** session read (`requireAdmin`, dashboard layout/page, login page, `/api/user`, `/api/email`, `/api/email/count`) to `auth.api.getSession({ headers: await headers() })`. `/api/user` creation moves to Better Auth's admin `createUser`. |
| 4 | `refactor(auth)` | Repoint every **client** session consumer (`next-auth/react` → `@/lib/auth-client`): `useSession` across Navbar/MyAccount/AccountMenu/MemberDetails/WorkDetails/New{Member,Work}Form; `LoginForm` → `signIn.email` (`{data,error}`); `SignOutButton` → `signOut()` + manual redirect. |
| 5 | `feat(auth)` | `middleware.js` → `middleware.ts`: keep the next-intl composition; replace next-auth `withAuth` with an **optimistic** `getSessionCookie()` check. |
| 6 | `chore(auth)` | Remove the next-auth surface: delete `[...nextauth]/route.js`, `lib/authOptions.js`, `providers/SessionProvider.jsx` (+ its layout wrap); uninstall `next-auth`. |
| 7 | `feat(auth)` | `scripts/migrations/migrate-to-better-auth.ts` — bcrypt-preserving migration. |
| 8 | `fix(auth)` | Repoint account-settings actions (`updateUser` / `updateUserImage` / `updateUserPassword`) to Better Auth (`auth.api.updateUser` / `changePassword`); drop the now-unused legacy `models/user.js`. (Found in review — they still hit the legacy Mongoose model, so profile/password edits were broken post-migration.) |

## Data model & migration

- **Collections:** legacy Mongoose `User` → collection **`users`** (plural). Better Auth's collections are **singular** (`user`, `account`, `session`) → no collision.
- **Mapping:** `userMail`→`user.email`, `fullName`→`user.name`, `img`→`user.image`, `role`→`user.role` (surfaced by the admin plugin). The password moves to **`account`** (`providerId: "credential"`, `account.password` = the existing bcrypt hash) — never on `user`.
- **Verified schema (Better Auth mongodbAdapter):** `user._id` / `account.userId` are **ObjectId**; `account.accountId` is the **string hex** of the user id. `scripts/migrations/migrate-to-better-auth.ts` mirrors this exactly and is **idempotent** (skips users whose email already exists in `user`).
- **Run manually; dry-run by default, `--apply` to write** (safety retrofit — PR #163, issue #159 B3): preview with `node --env-file=.env.local --import tsx scripts/migrations/migrate-to-better-auth.ts` (prints its mode + the resolved `db.databaseName`, writes nothing), then re-run with a trailing `--apply` to perform the writes.
- **Executed against production on 2026-07-11.** The migration had previously only been run against DB copies, so prod's `team_random_webApp` held 4 legacy `users` but **zero** Better Auth `user`/`account` docs → every admin login returned `401 [Better Auth]: User not found` (public pages were unaffected — they read `members`/`works` via Mongoose). Resolved by running with `--apply`: 4 accounts migrated, bcrypt hashes preserved. Admin signs in with `kberkeyilmaz@teamrandom.com`.
- **Legacy model removed:** `models/user.js` (the Mongoose `User`) is deleted — after the account-settings actions moved to Better Auth, nothing references it.

## Deviations from the original plan (flagged per CLAUDE.md rule 2)

1. **Better Auth uses a dedicated `MongoClient`, not Mongoose's pool.** The plan/#87 brief specified sourcing the native `Db` from `mongoose.connection` to avoid a second connection. That requires a **top-level `await`** (Mongoose's `connection.db` is undefined until the connection resolves), which **breaks CJS tooling** — `esbuild`/`tsx` (used to run the migration script and, in Phase 4, tests) cannot compile top-level await, and it is fragile in the build. `lib/auth.ts` now opens a dedicated native `MongoClient` on the **same `MONGO_URI`** (the driver connects lazily on first use → no top-level await, tooling-safe). Cost: a second pool to the same database (one credential set). **Phase 2 (DB/env hardening) can consolidate pooling.**
2. **`jsconfig.json` → `tsconfig.json` was pulled forward from Phase 3.** Introducing the first `.ts` files (the auth beachhead) requires a `tsconfig.json` for Next + `tsc`. The config already carried TS-appropriate options; Phase 3 still owns the full TS sweep.

## Environment

- **Added:** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (read automatically by Better Auth).
- **Retired:** `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
- Formal Zod-validated env (`lib/env.ts`) + a generated `.env.example` land in Phase 2/5.

## Verification

Verified **empirically** against a throwaway Dockerized MongoDB (single-node replica set), driving the real `next dev` server and the Better Auth server API. Nothing touched a real database — this workspace has no `.env` and no real DB credentials.

**Migration + password preservation (Better Auth server API):**

| Assertion | Result |
|---|---|
| Seeded legacy `users` admin migrates → `user` + `account` | ✓ |
| Migrated user signs in with the **original** password | ✓ (bcrypt hash preserved) |
| Session carries `role = admin` | ✓ (admin plugin surfaces role) |
| Wrong password rejected | ✓ |

**Account settings (server API, exactly as the actions invoke it):**

| Assertion | Result |
|---|---|
| `updateUser` → name + image persist | ✓ |
| `changePassword` → new bcrypt hash written to `account` (old password required) | ✓ |
| Sign-in with the new password works; old + wrong-current rejected | ✓ |

**HTTP end-to-end (`next dev` + real requests):**

| # | Assertion | Result |
|---|---|---|
| A | `POST /api/auth/sign-in/email` with migrated creds | 200 + session cookie |
| B | `GET /dashboard` anonymous | 307 → `/login` |
| C | `GET /dashboard` with the admin session cookie | 200 |
| D | `GET /api/email` anonymous | 401 |

**Static:** `tsc --noEmit` clean (0 errors) throughout; `grep` confirms zero `next-auth` imports remain (only AUDIT provenance comments mention it).

## Deferred / follow-ups

- **Full Playwright e2e** (login form UI, non-admin bounce, forged-action replay) is best expressed in the Phase 4 test harness; the HTTP smoke test above already proves the gate, the sign-in endpoint, and the inbox guard.
- **Email change** in account settings is deferred: Better Auth requires a verification-email flow for it, which needs email-sending infrastructure not yet wired for Better Auth. `updateUser` updates name/image and rejects email edits with a clear message; wiring change-email verification is a follow-up.
- **Connection pooling:** Phase 2 formalizes the cached Mongoose connection and can unify it with Better Auth's client.
- **`lib/authGuard.js` / other JS auth files** are typed as `.ts` in the Phase 3 sweep.
- The throwaway verification harness (seed / probe / verify) lives in the gitignored `.context/` and is a candidate to promote into Phase 4.

## References

- Plan: [`docs/migration/plan.md`](../plan.md) §"Phase 1"
- PR #88 · Issue [#87](https://github.com/KBerkeYilmaz/team_random/issues/87) · Epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81)
- Better Auth: [MongoDB adapter](https://www.better-auth.com/docs/adapters/mongo) · [Next.js](https://www.better-auth.com/docs/integrations/next) · [Admin plugin](https://www.better-auth.com/docs/plugins/admin) · [Email & Password](https://www.better-auth.com/docs/authentication/email-password)
