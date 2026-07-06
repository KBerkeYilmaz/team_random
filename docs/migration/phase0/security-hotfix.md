<!--
Purpose: Document the Phase 0 security hotfix of the team-random modernization —
what changed, why, and how it was verified. One doc per phase lives under docs/migration/.
-->

# Phase 0 — Security Hotfix

**Status:** Shipped — PR [#83](https://github.com/KBerkeYilmaz/team_random/pull/83) (closes issue [#82](https://github.com/KBerkeYilmaz/team_random/issues/82))
**Epic:** [#81](https://github.com/KBerkeYilmaz/team_random/issues/81) — 7-phase modernization to 2026 best practices
**Date:** 2026-07-06
**Constraints:** No auth-library change (stays on next-auth v4), no TypeScript, no framework bump. Small, surgical, independently revertible.

## Summary

The May-2024 codebase made authorization decisions from **client-supplied input**. Every mutating server action accepted a `role` argument from the caller and gated on `if (role !== "admin")`, so a crafted request passing `role: "admin"` bypassed all authorization. The admin-only surfaces (user creation, the Gmail inbox, the dashboard) were likewise unprotected on the server.

Phase 0 moves every authorization decision to the **server session** and locks the exposed API surface. It does **not** swap the auth library — that is Phase 1 (Better Auth). The goal of this phase was to stop the bleeding fast, in a diff that is easy to review and revert.

## Vulnerabilities Closed

| Area | Before | After |
|---|---|---|
| Mutating server actions | Trusted a client-supplied `role` param | `requireAdmin()` derives role from the server session |
| `POST /api/user` | No auth; wrote `role` from the body; also exported as `GET`; returned the bcrypt hash | Admin-only (403); `role` forced to `"user"`; no `GET`; hash omitted |
| `GET /api/email`, `/api/email/count` | Connected to Gmail IMAP with no auth (world-readable inbox) | Admin session required (401) |
| Dashboard | Layout was a passthrough; role checked only on the client | Server-side gate in the layout redirects non-admins |
| `createMember` (no image) | Called without a `role`, so admins were wrongly rejected | Fixed by removing the `role` param entirely |

## What Changed (one commit per concern)

1. `feat(auth)` `020b378` — extract `authOptions` into `lib/authOptions.js` (drop dead callback code); add `lib/authGuard.js` → `requireAdmin()`.
2. `fix(security)` `1cca161` — enforce `requireAdmin()` in all 10 mutating actions; remove the `role` param; rename `UpdateWork` → `updateWork`.
3. `refactor` `59737b1` — strip the now-dead `role` args from the 8 client call sites.
4. `fix(security)` `dd00404` — lock down `POST /api/user` and stop the hash leak.
5. `fix(security)` `25a6e08` — admin-gate the inbox routes; forward the session cookie from `fetchInbox`/`fetchUnseen` so the admin's own inbox still loads.
6. `fix(security)` `85911cb` — gate the dashboard layout server-side.

## Role-Based Access: Strengthened, Not Removed

This is the most common misread of the diff, so to be explicit:

**Role-based access is fully intact and now enforced where it counts — the server.**

- `role` still lives on the user model and still flows into the session (the next-auth `jwt`/`session` callbacks set `session.user.role`).
- Every admin-only operation still requires `role === "admin"`. The only difference is *where the check reads role from*: the **server session** (`requireAdmin()` / `getServerSession(authOptions)`) instead of a value the client passed in.
- The client-side `role !== "admin"` checks were **kept** as UX hints (they show a friendly toast); they are simply no longer the security boundary.

**What was removed** is the *client-supplied `role` argument* to the server actions (the actual vulnerability) and the dead `GET /api/user` export — not role-based access itself.

### One intentional behavior change

Previously the dashboard was reachable by **any logged-in user**, because the only server-side check was middleware asserting a token existed (not its role). Now the dashboard layout redirects anyone whose session role is not `admin`. So a **non-admin (`role: "user"`) account can no longer open the dashboard** — by design, the dashboard is admin-only. **Admin accounts are unaffected** (verified below).

## Verification

- **Build:** `next build` reaches `✓ Compiled successfully` (a full build additionally needs EdgeStore keys + a database, which this workspace lacks).
- **End-to-end (Playwright, real Chromium against the running app + a throwaway Dockerized MongoDB): 8/8 passing.**

  | # | Assertion | Proves |
  |---|---|---|
  | 1–2 | `GET /api/email` & `/api/email/count` unauth → 401 | inbox no longer world-readable |
  | 3 | `POST /api/user` unauth (`role:"admin"`) → 403 | open registration closed |
  | 4 | `GET /api/user` → 405 | dangerous GET export removed |
  | 5 | `/dashboard` anon → `/login` | server-side dashboard gate |
  | 6 | admin login → dashboard | auth works |
  | 7 | admin creates a member **without an image** → success + row in DB | the correctness bug is fixed |
  | 8 | authenticated **non-admin** → 401 inbox, 403 register, bounced from `/dashboard` | role enforced, not just auth |

### Test accounts

The `admin@teamrandom.com` / `user@teamrandom.com` accounts used above were seeded into a **throwaway local Docker MongoDB** and **deleted at teardown**. They never touched any real database — this workspace has no `.env` and no DB credentials, so the real/hosted data was never reachable. The reusable harness lives at `.context/e2e/` (gitignored) and is a candidate to promote into Phase 5.

## Deferred / Follow-ups

- **Forged server-action replay** (a POST with a tampered `Next-Action` payload) is best expressed as a Phase 5 unit test that mocks `getServerSession` and asserts the action returns an error and does not mutate. Test 8 already proves server-side role enforcement for an authenticated non-admin.
- `lib/authOptions.js` is a **throwaway** — Phase 1 removes it when Better Auth lands.
- The repo's ESLint config is pre-existingly broken (`Failed to load config "next/babel"`); Phase 5 replaces it with flat config.

## References

- Modernization plan: `.context/plans/modernization-plan-team-random-next-js-portfolio-a.md`
- PR [#83](https://github.com/KBerkeYilmaz/team_random/pull/83) · Issue [#82](https://github.com/KBerkeYilmaz/team_random/issues/82) · Epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81)
- e2e harness: `.context/e2e/` (`seed.mjs`, `playwright.config.ts`, `security.spec.ts`, `README.md`)
