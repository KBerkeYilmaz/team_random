# Modernization Plan — Team Random (Next.js Portfolio/Agency Site)

## Context

`team-random` is a Next.js 14 App Router portfolio/agency site (public site + admin dashboard) built in **May 2024, pre-AI-tooling**, and dormant since. It's all JavaScript (`.jsx`), on MongoDB/Mongoose, next-auth v4, EdgeStore, and IMAP/SMTP email. The user wants to modernize it to 2026 best practices and make it a showcase-quality project.

Exploration surfaced that this isn't just staleness — there are **live security vulnerabilities**:

- **Privilege escalation**: every mutating server action takes `role` as a parameter *from the client* and gates on `if (role !== "admin")`. A crafted request passing `role:"admin"` bypasses all authorization. (`actions/userActions.js`, `actions/memberAction.js`, `actions/workAction.js`.)
- **Open admin registration**: `app/api/user/route.js` has no auth guard, writes `role` from the request body (L18), is exported as both `POST` **and `GET`** (L32), and **leaks the bcrypt hash** in its response (the "omit password" destructure targets the wrong field name, L21).
- **Unauthenticated inbox**: `app/api/email/route.js` GET and `app/api/email/count/route.js` connect to Gmail IMAP with no auth — anyone can read the mailbox.
- **No server-side dashboard gate**: `app/[locale]/(dashboard)/layout.jsx` is a passthrough; role is only checked on the (untrusted) client.
- A confirmed correctness bug from the same design: `NewMemberForm.jsx:104` calls `createMember(userInfo)` with no `role`, so legit admins are rejected when creating a member without an image.

Plus: DB connection isn't pooled (`lib/database.js` does `mongoose.connect()` per call + `process.exit(1)` → breaks serverless); i18n is ~5% real (next-intl wired up but ~95% strings hardcoded); redundant state libs (zustand + jotai, plus dead stores); no tests, no CI, minimal ESLint, ~59 stray `console.log`s; next-auth v4 is EOL.

**Intended outcome:** a secure, typed, tested, current-framework codebase. Decisions locked in with the user:

1. **Security first** — fix the auth/role vulnerabilities before anything else.
2. **Full TypeScript migration** (typed models, actions, env).
3. **Upgrade Next 14→15 and React 18→19.**
4. **Replace next-auth v4 with Better Auth** (user's explicit preference over Auth.js/NextAuth).
5. **Engineering polish only — no new AI features.**

## Execution workflow (tracking)

- **GitHub issues**: one tracking/epic issue linking all phases, plus one issue per phase (0–6) on `KBerkeYilmaz/team_random`, so progress is followable.
- **PRs**: one PR per phase, each branched off `main` and opened with `--base main`; each PR body closes its phase issue (`Closes #N`). Phase 0 ships first and standalone.

## Sequencing rationale (the load-bearing decisions)

- **Security hotfix ships first, in plain JS, still on next-auth v4** (Phase 0). The vulns are exploitable today; the Better Auth swap is large and risky. Decouple them — a small surgical fix ships security in hours and is independently revertible.
- **Better Auth before the full TS migration** (Phase 1 before Phase 3). Better Auth is TS-first; write *only the new auth surface* in TS as a beachhead (`allowJs` already lets `.ts` and `.jsx` coexist). Migrating everything to TS first would type the *old* next-auth session shape, then throw it away. Auth files get written in TS exactly once.
- **Next 15 / React 19 after the TS sweep, via the official codemod** (Phase 4). Next 15 makes `params`/`searchParams`/`headers()`/`cookies()` **async** — pervasive across every page/layout and the Better Auth `getSession` calls. Running `@next/codemod` on already-typed files lands the async-signature change cleanly with compiler backup.

**Order:** Phase 0 (security hotfix) → 1 (Better Auth) → 2 (DB/env) → 3 (TypeScript) → 4 (Next 15/React 19) → 5 (tooling/tests/CI) → 6 (i18n + frontend polish). Each phase is independently shippable.

---

## Phase 0 — Security hotfix (P0, ship first) · ~0.5–1 day

Close privilege escalation, the exposed inbox, and open registration **without** touching the auth library. Stay on next-auth v4, stay in JS.

1. **Derive role from the server session, not the client.** Extract the inlined `authOptions` from `app/api/auth/[...nextauth]/route.js` into `lib/authOptions.js` (throwaway, removed in Phase 1) and delete that route's dead callback code (L56–73). Add `lib/authGuard.js` exporting `requireAdmin()` → calls `getServerSession(authOptions)`, throws a **messaged** error if session missing or `session.user.role !== "admin"`. Call it at the top of every mutating action in `userActions.js`, `memberAction.js`, `workAction.js`. Remove the `role` parameter from all their signatures. Rename `UpdateWork` → `updateWork`.
2. **Strip `role` from client call sites** (now no-ops): the `NewWorkForm`/`NewMemberForm`/`EditWorkForm`/`EditMemberForm`/`EditUserForm`/`EditUserPasswordForm`/`MemberDetails`/`WorkDetails` calls — including the **missing-arg bug at `NewMemberForm.jsx:104`**. Keep client `role` checks only as UX hints, not the security boundary.
3. **Guard `app/api/user/route.js`**: remove the `GET` export; force `role:"user"` (never read `res.role`); require an admin session or return 403 (no public signup UI exists); fix the password-leak destructure (omit `userPassword` explicitly).
4. **Guard the inbox routes**: `app/api/email/route.js` GET and `app/api/email/count/route.js` — `getServerSession` + 401 if not admin. Leave the contact-form `POST` open.
5. **Gate the dashboard server-side**: in `app/[locale]/(dashboard)/layout.jsx` fetch the session and `redirect("/login")` (via `@/navigation`, locale-aware) if missing/non-admin — the single chokepoint for all dashboard pages.

**Verify:** log in as admin → CRUD works incl. creating a member *without* an image; replay a server-action request forging `role:"admin"` as non-admin → rejected; `/api/email*` unauthenticated → 401; `POST /api/user` with `role:"admin"` → forbidden/forced to `user`; `/dashboard` logged out → redirect. `npm run build` passes.

---

## Phase 1 — Replace next-auth v4 with Better Auth (the hard part) · ~3–5 days

**Status: ✅ Shipped** (PR #TBD, closes #87) — see [phase1/better-auth.md](phase1/better-auth.md). Two deviations from the spec below: (1) Better Auth uses a dedicated `MongoClient` on the same `MONGO_URI` rather than Mongoose's pool — sourcing the `Db` from Mongoose required a top-level `await` that breaks CJS tooling (tsx / Phase 5 tests); (2) `jsconfig.json` → `tsconfig.json` was pulled forward from Phase 3 to host the first `.ts` files.

Swap the auth engine to Better Auth over MongoDB, keep Mongoose for domain models, **preserve existing bcrypt passwords**, enforce admin via the admin plugin server-side. New auth files in **TypeScript**.

- **Source the native `Db` from Mongoose** (Better Auth's `mongodbAdapter` needs a native `Db`, not Mongoose): after `connectDB()`, use `mongoose.connection.db` (+ `.getClient()` for the optional transaction `client`). One pool, one credential set — no second connection. Ensure the Mongoose connection resolves before `auth` handles a request (cached-connect promise; Phase 2 formalizes it).
- **Subsume User into Better Auth's `user` collection**: `email`←`userMail`, `name`←`fullName`, `image`←`img`; `role` comes from the **admin plugin** (`admin({ adminRoles:["admin"] })`); password moves into Better Auth's **`account`** collection (`providerId:"credential"`, hash in `account.password`) — *not* on `user`. Add only truly-needed extras via `user.additionalFields` (note: additionalFields can't be column-remapped).
- **Migration script** `scripts/migrate-to-better-auth.ts` (run manually against a DB copy): per legacy user, insert the Better Auth `user` doc + `account` doc carrying the existing bcrypt hash; verify with a sign-in. Keep `models/user.js` until cutover is verified, then drop it.
- **Keep bcrypt** via custom hash/verify (documented migration path — no forced reset): `emailAndPassword.password = { hash: p => bcrypt.hash(p, SALT_ROUNDS), verify: ({hash,password}) => bcrypt.compare(password, hash) }`.
- **Next wiring**: `lib/auth.ts` (`betterAuth({ database: mongodbAdapter(db,{client}), emailAndPassword:{…bcrypt…}, plugins:[admin({adminRoles:["admin"]}), nextCookies()] })` — **`nextCookies()` last**); `app/api/auth/[...all]/route.ts` (`export const {GET,POST}=toNextJsHandler(auth)`); `lib/auth-client.ts` (`createAuthClient({plugins:[adminClient()]})` from `better-auth/react`). **Delete** `app/api/auth/[...nextauth]/route.js`, `providers/SessionProvider.jsx` (+ its use in `app/[locale]/layout.jsx`), and `lib/authOptions.js`.
- **Repoint session consumers** `next-auth/react` → `@/lib/auth-client`: `MyAccount`, `AccountMenu` (guard `data?.user?.name?.[0]`), `SignOutButton`, `LoginForm` (`authClient.signIn.email` — error shape becomes `{data,error}`), and the forms. Server session: `auth.api.getSession({ headers: await headers() })` in `dashboard/layout.jsx` (the enforcement point), `dashboard/page.jsx`, `login/page.jsx`, and `requireAdmin`.
- **Middleware** `middleware.ts`: keep the next-intl composition unchanged; replace `withAuth` with an **optimistic** `getSessionCookie(request)` existence check (redirect to `/login`). Real admin enforcement stays in the dashboard **layout** (Better Auth docs: middleware cookie checks are not a security boundary).
- **Env**: add `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`, retire `NEXTAUTH_SECRET` (folded into Phase 2).

**Gotchas:** adapter `Db` must be defined before first request; password belongs on `account` not `user`; `role` on the client type requires `adminClient()` registered. **Verify:** run migration on a DB copy → migrated user logs in with their *existing* password, session has `role`; non-admin/anon → redirected; forged-role action still rejected; password change writes new bcrypt hash to `account`; grep confirms zero `next-auth` imports before removing the dep; `npm run build`.

---

## Phase 2 — Database & env hardening (P1) · ~1–1.5 days

- **`lib/database.ts`**: replace per-call connect + `process.exit(1)` with the **global-cached-connection** pattern (cache the *promise*), ESM not CommonJS. This is what Phase 1's adapter leans on.
- **`lib/env.ts`**: Zod-validated typed env parsed once, fail-fast: `MONGO_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_EMAIL`, `APP_PASSWORD`, optional `NEXT_PUBLIC_API_BASE_URL`, `IMAP_HOST` (default `imap.gmail.com`), `SALT_ROUNDS` (default 10). Import wherever `process.env.*` is read.
- **Data-fetch hygiene**: add `.lean()`/`.select()` to `getMembers`/`getWorks`/`getMember`/`getWork`; drop the verbose manual field-mapping in `getMembers` (`memberAction.js:11–24`); add optional skip/limit pagination.
- **Kill hardcoded fallbacks** (`emailAction.js:4` localhost, inline `imap.gmail.com`, literal salt rounds) — all from `lib/env.ts`.
- **Replace `console.log` (~59)**: remove debug logs; keep one `console.error` in genuine catch blocks (or a tiny `lib/logger.ts`).

**Verify:** concurrent dev requests reuse a single connection; unset a required env var → fail-fast with a clear message; lists still render post-mapping-removal; `npm run build`.

---

## Phase 3 — Full TypeScript migration (P1) · ~3–5 days

- `jsconfig.json` → `tsconfig.json` (keep `strict`, `paths`, `moduleResolution:"bundler"`); set `components.json` `"tsx": true`; add a `typecheck` script (`tsc --noEmit`).
- **Models** → `.ts` with interfaces + typed schemas (`Schema<IMember>`, `models.X as Model<IX>`). Flag `work.workContributors` (String vs the commented-out ObjectId ref).
- **Actions** → `.ts` with a shared discriminated-union `ActionResult<T> = { data:T } | { error:string } | { errors:FieldErrors }`, making the `result.error`/`result.errors` form checks type-safe. Share Zod schemas via `z.infer` between action and form.
- **Components/pages/forms** → `.tsx`, leaf-up (shadcn `ui/` first — CLI can re-emit as TSX — then shared components, forms, pages). The `forwardRef`+generic image dropzones are the fiddliest.
- Migrate `lib/*`, `navigation.js`, `i18n.js`, `app/fonts.js` → `.ts` (`config.ts` already TS).

`allowJs:true` keeps the app green throughout; do it in small PRs. **Verify:** `tsc --noEmit` clean, `npm run build`, smoke-test every route — type-only, no behavior change.

---

## Phase 4 — Next 14→15 / React 18→19 (P1) · ~1.5–2.5 days

- Run **`npx @next/codemod@canary upgrade latest`** — bumps `next`/`react`/`react-dom`/`eslint-config-next` and applies the **async `params`/`searchParams`/`cookies()`/`headers()`** codemod across all pages/layouts and the Better Auth `getSession` calls (lands on Phase-3-typed signatures).
- `@types/react`/`@types/react-dom` → 19.
- **next-intl compat**: bump if needed for Next 15 (newer next-intl makes request-config `locale` async) — the most likely integration snag.
- Verify peer-dep compatibility for EdgeStore / Framer Motion 11 / Radix under React 19.
- Audit caching: Next 15 is uncached-by-default; inbox actions already use `cache:"no-store"`; confirm `revalidatePath` usage still holds.

**Verify:** `npm run build` on 15, `tsc --noEmit`, manual pass of all routes incl. login→session→dashboard (async `headers()`), both locales resolve; grep for any sync `params.` the codemod missed.

---

## Phase 5 — Tooling, tests, CI (P1/P2) · ~2–3 days

- **ESLint 9 flat config** `eslint.config.mjs`: `next/core-web-vitals` + `next/typescript` + `react-hooks` + `jsx-a11y` + `import` (order).
- **Prettier** explicit `prettier.config.mjs` (wire the already-installed tailwind class-sort plugin).
- **Pre-commit**: `husky` + `lint-staged` → `eslint --fix` + `prettier` + `tsc --noEmit` on staged files.
- **Tests**: **Vitest** + RTL (Zod schemas, `ActionResult` logic, `requireAdmin`, form validation — incl. a test proving the forged-role request is rejected) and **Playwright** e2e (login, role enforcement, CRUD, contact form).
- **CI** `.github/workflows/ci.yml`: install → `tsc --noEmit` → lint → `vitest run` → `next build` → Playwright (test DB / `mongodb-memory-server`), Node 20.
- **Docs**: real `README`; `.env.example` generated from `lib/env.ts` (single source of truth).

*The lint/prettier/husky config can be pulled earlier (right after Phase 0) for guardrails during the migration; keep tests/CI here so they assert the final TS + Next 15 shape.* **Verify:** lint/typecheck/vitest/playwright green locally; PR CI green; a bad commit is blocked by husky.

---

## Phase 6 — i18n completion + frontend polish (P1/P2) · ~3–5 days

- **i18n**: expand `messages/en.json`/`tr.json` from 2 keys to full coverage; extract ~95% hardcoded strings (Navbar, Footer, `HeroWavy`, About, forms, ~30 Zod messages) into namespaced keys via `useTranslations`/`getTranslations`; move Zod messages into schema factories taking `t` so validation localizes.
- **State consolidation**: standardize on **zustand**; port the inbox jotai atom (`use-mail.jsx`) to a small store; **delete** dead `stores/counter-store.js`, `components/Counter.jsx`, the broken-import `stores/mailStore.js`, and jotai from deps.
- **RSC-by-default**: remove needless `"use client"` (~55/90 files — `Footer`, static content) leaf-up; keep it only where hooks/handlers/`useSession`/framer-motion/dropzones need it.
- **Error/loading boundaries**: add `error.tsx` at `app/[locale]/` and `(dashboard)/` + root `global-error.tsx`; replace manual `if(!data)` blocks with `Suspense` + the existing `loading.jsx` files.
- **a11y**: skip link + real `<main>` landmark on the public layout; `aria-current` on active nav; consistent `htmlFor`/`id`; descriptive `alt`; `rel="noopener noreferrer"` on external links; guard `AccountMenu` name access.
- **DRY dropzones**: extract a shared `useImageDropzone` hook/base; the three variants become thin wrappers. Extract the copy-pasted responsive-width `useEffect`.
- **Images**: replace raw `<img>` with `next/image` (remote patterns already in `next.config.mjs`).

**Verify:** EN/TR toggle switches every visible string incl. validation errors; keyboard-only tab-through + skip link; error boundaries render on a thrown error; removed state lib absent from the bundle; axe/Lighthouse a11y pass; `npm run build`.

---

## Effort roll-up

| Phase | Scope | Effort |
|---|---|---|
| 0 | Security hotfix (JS, on next-auth) | 0.5–1 d |
| 1 | Better Auth migration (new files TS) | 3–5 d |
| 2 | DB/env hardening | 1–1.5 d |
| 3 | Full TypeScript migration | 3–5 d |
| 4 | Next 15 / React 19 | 1.5–2.5 d |
| 5 | Tooling / tests / CI | 2–3 d |
| 6 | i18n + frontend polish | 3–5 d |
| **Total** | | **~15–23 days** |

**Dependencies:** Phase 1 depends on Phase 0's server-side role derivation (so the swap doesn't reintroduce the vuln) and Phase 2's cached connection (pull forward for the `Db`). Phase 3 depends on Phase 1 (type against final auth). Phase 4's codemod runs after Phase 3. Phases 5–6 want the final TS/Next-15 shape (except Phase 5's lint/format config, which can move earlier).

## Critical files

- `app/api/auth/[...nextauth]/route.js` → replaced by `app/api/auth/[...all]/route.ts` + `lib/auth.ts` + `lib/auth-client.ts`
- `actions/{userActions,memberAction,workAction}.js` — the P0 role-parameter fix (all three)
- `app/api/user/route.js`, `app/api/email/route.js`, `app/api/email/count/route.js` — API auth guards
- `app/[locale]/(dashboard)/layout.jsx` — the single server-side admin enforcement chokepoint
- `middleware.js` → `middleware.ts` — next-auth+next-intl → Better Auth (optimistic) + next-intl
- `lib/database.js` — cached connection + source of the native `Db` for Better Auth
- `lib/env.ts`, `lib/authGuard.js`→`.ts`, `scripts/migrate-to-better-auth.ts` — new

## Better Auth references (verified July 2026)

- [MongoDB adapter](https://www.better-auth.com/docs/adapters/mongo) · [Next.js integration](https://www.better-auth.com/docs/integrations/next) · [Admin plugin](https://www.better-auth.com/docs/plugins/admin) · [Email & Password (custom hash/verify)](https://www.better-auth.com/docs/authentication/email-password) · [Database concepts (additionalFields)](https://www.better-auth.com/docs/concepts/database) · [Clerk migration (bcrypt pattern)](https://www.better-auth.com/docs/guides/clerk-migration-guide)

---

## Deferred / candidate future migrations

Ideas considered during scoping but **explicitly out of scope for Phases 0–6**. Recorded here (CLAUDE.md rule 1) so they are not re-litigated cold.

### Prisma + tRPC data layer — considered & deferred (2026-07-06)

Replacing the in-app ORM (Mongoose) with **Prisma**, and fronting the domain data with a **tRPC** API layer, was weighed and **deferred**. The data layer stays **Mongoose + MongoDB**, and Phase 1 (Better Auth) is unchanged (native `mongodbAdapter` sourcing the `Db` from the Mongoose connection; Mongoose kept for domain models).

**Why deferred:**
- **Prisma is hobbled on MongoDB** — pinned to Prisma v6 (v7 dropped Mongo support), no real migrations (`prisma db push` only), and it requires a replica-set deployment.
- **tRPC is low-value for this app today** — it is Server-Actions-first and every domain read is server-rendered in RSCs (no client-side data fetching, no React Query/SWR — only `@tanstack/react-table` for UI). On TypeScript the Server Actions are already end-to-end typed, so tRPC would add an RPC layer + provider plumbing for little gain. (The one clean fit: Phase 0's `requireAdmin()` → a tRPC `adminProcedure` middleware.)

**If ever pursued** — treat it as its own migration, not a bolt-on:
- Pair Prisma with **Postgres**, its full-power home (v7, real migrations, no ObjectId friction). The domain models are flat and relation-free (`work.workContributors` is a plain string), so it is a small 3-table schema + one-time data move.
- Adopt tRPC only if genuinely client-heavy / interactive features arrive.
- Better Auth could stay on Mongo (two databases) or also move to Postgres via its Prisma adapter (which works cleanly on SQL, unlike the Prisma + Mongo ObjectId issues).
