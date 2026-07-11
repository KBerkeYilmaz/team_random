# Modernization Plan — Team Random (Next.js Portfolio/Agency Site)

> ⚠️ **Sequencing reshaped 2026-07-09 (epic #81) — the per-phase sections below still use
> the pre-reshape 0–7 numbering.** The canonical phase index + current status is
> [`docs/migration/README.md`](README.md) (Phases 0–9). Renumbering these detailed sections
> to 0–9 — tooling/CI ahead of the Next 16 bump, un-defer the Prisma-on-Postgres + tRPC
> data layer, split i18n / frontend polish, pnpm → Phase 9 — is tracked in
> [#142](https://github.com/KBerkeYilmaz/team_random/issues/142). Until then read the phase
> **numbers** below as historical; the **scope** of each is still accurate.

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
3. **Upgrade Next 14→16 and React 18→19.**
4. **Replace next-auth v4 with Better Auth** (user's explicit preference over Auth.js/NextAuth).
5. **Engineering polish only — no new AI features.**

## Execution workflow (tracking)

- **GitHub issues**: one tracking/epic issue linking all phases, plus one issue per phase (0–6) on `KBerkeYilmaz/team_random`, so progress is followable.
- **PRs**: one PR per phase, each branched off `main` and opened with `--base main`; each PR body closes its phase issue (`Closes #N`). Phase 0 ships first and standalone.

## Sequencing rationale (the load-bearing decisions)

- **Security hotfix ships first, in plain JS, still on next-auth v4** (Phase 0). The vulns are exploitable today; the Better Auth swap is large and risky. Decouple them — a small surgical fix ships security in hours and is independently revertible.
- **Better Auth before the full TS migration** (Phase 1 before Phase 3). Better Auth is TS-first; write *only the new auth surface* in TS as a beachhead (`allowJs` already lets `.ts` and `.jsx` coexist). Migrating everything to TS first would type the *old* next-auth session shape, then throw it away. Auth files get written in TS exactly once.
- **Next 16 / React 19 after the TS sweep, via the official codemod** (Phase 4). Async `params`/`searchParams`/`headers()`/`cookies()` (introduced in Next 15, carried into 16) are pervasive across every page/layout and the Better Auth `getSession` calls; Next 16 additionally renames the middleware convention to **`proxy`** (`middleware.ts` → `proxy.ts`). Running `@next/codemod` on already-typed files lands both changes cleanly with compiler backup.

**Order:** Phase 0 (security hotfix) → 1 (Better Auth) → 2 (DB/env) → 3 (TypeScript) → 4 (Next 16/React 19) → 5 (tooling/tests/CI) → 6 (i18n + frontend polish) → 7 (npm → pnpm). Each phase is independently shippable.

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

**Status: ✅ Shipped** (PR #88, closes #87) — see [phase1/better-auth.md](phase1/better-auth.md) for the full write-up. Cross-phase note: `jsconfig.json` → `tsconfig.json` was pulled forward from Phase 3 to host the first `.ts` files (the full TS sweep still happens in Phase 3).

Swap the auth engine to Better Auth over MongoDB, keep Mongoose for domain models, **preserve existing bcrypt passwords**, enforce admin via the admin plugin server-side. New auth files in **TypeScript**.

- **Give Better Auth its own native `MongoClient`** (its `mongodbAdapter` needs a native `Db`, not a Mongoose model): `new MongoClient(process.env.MONGO_URI).db()` — the driver connects lazily on first use, so there is no top-level `await` and the module stays CJS/ESM-tooling-safe (tsx, tests, build). Same `MONGO_URI` as Mongoose (one credential set), separate pool. *(The initial brief reused Mongoose's `connection.db`, but that needs a top-level `await` — `db` is undefined until connected — which breaks CJS tooling, so this was switched. Phase 2 can consolidate the two pools.)*
- **Subsume User into Better Auth's `user` collection**: `email`←`userMail`, `name`←`fullName`, `image`←`img`; `role` comes from the **admin plugin** (`admin({ adminRoles:["admin"] })`); password moves into Better Auth's **`account`** collection (`providerId:"credential"`, hash in `account.password`) — *not* on `user`. Add only truly-needed extras via `user.additionalFields` (note: additionalFields can't be column-remapped).
- **Migration script** `scripts/migrations/migrate-to-better-auth.ts` (run manually against a DB copy): per legacy user, insert the Better Auth `user` doc + `account` doc carrying the existing bcrypt hash; verify with a sign-in. Keep `models/user.js` until cutover is verified, then drop it.
- **Keep bcrypt** via custom hash/verify (documented migration path — no forced reset): `emailAndPassword.password = { hash: p => bcrypt.hash(p, SALT_ROUNDS), verify: ({hash,password}) => bcrypt.compare(password, hash) }`.
- **Next wiring**: `lib/auth.ts` (`betterAuth({ database: mongodbAdapter(db,{client}), emailAndPassword:{…bcrypt…}, plugins:[admin({adminRoles:["admin"]}), nextCookies()] })` — **`nextCookies()` last**); `app/api/auth/[...all]/route.ts` (`export const {GET,POST}=toNextJsHandler(auth)`); `lib/auth-client.ts` (`createAuthClient({plugins:[adminClient()]})` from `better-auth/react`). **Delete** `app/api/auth/[...nextauth]/route.js`, `providers/SessionProvider.jsx` (+ its use in `app/[locale]/layout.jsx`), and `lib/authOptions.js`.
- **Repoint session consumers** `next-auth/react` → `@/lib/auth-client`: `MyAccount`, `AccountMenu` (guard `data?.user?.name?.[0]`), `SignOutButton`, `LoginForm` (`authClient.signIn.email` — error shape becomes `{data,error}`), and the forms. Server session: `auth.api.getSession({ headers: await headers() })` in `dashboard/layout.jsx` (the enforcement point), `dashboard/page.jsx`, `login/page.jsx`, and `requireAdmin`.
- **Middleware** `middleware.ts`: keep the next-intl composition unchanged; replace `withAuth` with an **optimistic** `getSessionCookie(request)` existence check (redirect to `/login`). Real admin enforcement stays in the dashboard **layout** (Better Auth docs: middleware cookie checks are not a security boundary).
- **Env**: add `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`, retire `NEXTAUTH_SECRET` (folded into Phase 2).

**Gotchas:** password belongs on `account` not `user`; `role` on the client type requires `adminClient()` registered. **Verify:** run migration on a DB copy → migrated user logs in with their *existing* password, session has `role`; non-admin/anon → redirected; forged-role action still rejected; password change writes new bcrypt hash to `account`; grep confirms zero `next-auth` imports before removing the dep; `npm run build`.

---

## Phase 2 — Database & env hardening (P1) · ~1–1.5 days

**Status: ✅ Shipped** (PR #97, closes #96) — see [phase2/db-env-hardening.md](phase2/db-env-hardening.md) for the full write-up. Note: the Better Auth + Mongoose pools were evaluated for consolidation and **deferred** (a top-level `await` breaks the tsx/test tooling); both now read `MONGO_URI` from `lib/env.ts`.

- **`lib/database.ts`**: replace per-call connect + `process.exit(1)` with the **global-cached-connection** pattern (cache the *promise*), ESM not CommonJS. This is what Phase 1's adapter leans on.
- **`lib/env.ts`**: Zod-validated typed env parsed once, fail-fast: `MONGO_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_EMAIL`, `APP_PASSWORD`, optional `NEXT_PUBLIC_API_BASE_URL`, `IMAP_HOST` (default `imap.gmail.com`), `SALT_ROUNDS` (default 10). Import wherever `process.env.*` is read.
- **Data-fetch hygiene**: add `.lean()`/`.select()` to `getMembers`/`getWorks`/`getMember`/`getWork`; drop the verbose manual field-mapping in `getMembers` (`memberAction.js:11–24`); add optional skip/limit pagination.
- **Kill hardcoded fallbacks** (`emailAction.js:4` localhost, inline `imap.gmail.com`, literal salt rounds) — all from `lib/env.ts`.
- **Replace `console.log` (~59)**: remove debug logs; keep one `console.error` in genuine catch blocks (or a tiny `lib/logger.ts`).

**Verify:** concurrent dev requests reuse a single connection; unset a required env var → fail-fast with a clear message; lists still render post-mapping-removal; `npm run build`.

---

## Phase 3 — Full TypeScript migration (P1) · ~3–5 days

**Status: ✅ Shipped** (PR #103, closes #102) — see [phase3/typescript-migration.md](phase3/typescript-migration.md) for the full write-up, deviations, and forced edits. Notes: `tsconfig.json` was already pulled forward in Phase 1 (so this phase only added the `typecheck` script + `components.json "tsx": true`); the shared **`ActionResult<T>` discriminated union below was replaced with a permissive `ActionState`** (no action returns `{ data }`; forms truthy-check `.error`/`.message`) — the discriminated union is deferred to Phase 5/6.

- `jsconfig.json` → `tsconfig.json` (keep `strict`, `paths`, `moduleResolution:"bundler"`); set `components.json` `"tsx": true`; add a `typecheck` script (`tsc --noEmit`).
- **Models** → `.ts` with interfaces + typed schemas (`Schema<IMember>`, `models.X as Model<IX>`). Flag `work.workContributors` (String vs the commented-out ObjectId ref).
- **Actions** → `.ts` with a shared discriminated-union `ActionResult<T> = { data:T } | { error:string } | { errors:FieldErrors }`, making the `result.error`/`result.errors` form checks type-safe. Share Zod schemas via `z.infer` between action and form. **Fold in the Phase 2-surfaced cleanups** (see `phase2/db-env-hardening.md` → "Observed but out of scope"): `workAction`'s `createWork`/`updateWork` catch logs and error returns say "work"/"member" inconsistently (copy-pasted from `memberAction` — the error string reads "…the member…" inside work actions), and `updateWork`/`deleteWork` carry unused `const result` bindings that `noUnusedLocals` will flag.
- **Components/pages/forms** → `.tsx`, leaf-up (shadcn `ui/` first — CLI can re-emit as TSX — then shared components, forms, pages). The `forwardRef`+generic image dropzones are the fiddliest.
- Migrate `lib/*`, `navigation.js`, `i18n.js`, `app/fonts.js` → `.ts` (`config.ts` already TS).

`allowJs:true` keeps the app green throughout; ship it as **small atomic commits within the single phase PR** (one PR per phase — CLAUDE.md). **Verify:** `tsc --noEmit` clean, `npm run build`, smoke-test every route — type-only, no behavior change.

---

## Phase 4 — Next 14→16 / React 18→19 (P1) · ~2–3 days

- Run **`npx @next/codemod@latest upgrade latest`** (targets **Next 16**) — bumps `next`/`react`/`react-dom`/`eslint-config-next` and applies the **async `params`/`searchParams`/`cookies()`/`headers()`** codemod across all pages/layouts and the Better Auth `getSession` calls (lands on Phase-3-typed signatures).
- `@types/react`/`@types/react-dom` → 19.
- **Middleware → Proxy (Next 16):** rename `middleware.ts` → **`proxy.ts`** and the exported `middleware` → `proxy` via `npx @next/codemod@latest rename-middleware-to-proxy .`. `proxy.ts` runs on the **Node.js runtime** (Edge unsupported) — fine for us; re-verify Better Auth's `getSessionCookie` and the next-intl composition run under it. Do **not** leave a stray `middleware.ts` (deprecated in 16; may be silently ignored → the optimistic gate stops firing, though the dashboard-layout enforcement still holds). Refs: [rename guide](https://nextjs.org/docs/messages/middleware-to-proxy) · [proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) · [v16 upgrade](https://nextjs.org/docs/app/guides/upgrading/version-16).
- **next-intl compat**: bump for Next 16 (newer next-intl makes request-config `locale` async, and must support the `proxy.ts` convention) — the most likely integration snag.
- Verify peer-dep compatibility for EdgeStore / Framer Motion 11 / Radix under React 19.
- Audit caching: Next 15+ is uncached-by-default; inbox actions already use `cache:"no-store"`; confirm `revalidatePath` usage still holds.

**Verify:** `npm run build` on 16, `tsc --noEmit`, manual pass of all routes incl. login→session→dashboard (async `headers()`, `proxy.ts` gate), both locales resolve; grep for any sync `params.` the codemod missed and any leftover `middleware.ts`.

---

## Phase 5 — Tooling, tests, CI (P1/P2) · ~2–3 days

**Status: 🚧 In progress** — this is **reshaped Phase 4** (the number here is pre-reshape, per [#142](https://github.com/KBerkeYilmaz/team_random/issues/142); [README.md](README.md) is canonical). Ships as focused slices under umbrella [#144](https://github.com/KBerkeYilmaz/team_random/issues/144): **4a — tooling guardrails** (ESLint 9 flat config, Prettier, husky + lint-staged) shipped (PR #146), closes [#145](https://github.com/KBerkeYilmaz/team_random/issues/145); **4b — unit tests** (Vitest + RTL) shipping ([#153](https://github.com/KBerkeYilmaz/team_random/issues/153)); 4c (e2e) / 4d (CI + docs) to follow — full write-up [phase4/tooling-tests-ci.md](phase4/tooling-tests-ci.md). **4a deviation:** eslint-config-next is **15** (not the `next/typescript` listed below, which needs config-next 15+) so `next/core-web-vitals` can run under ESLint 9 on Next 14; Phase 5's Next 16 codemod realigns config-next to 16.

- **ESLint 9 flat config** `eslint.config.mjs`: `next/core-web-vitals` + `next/typescript` + `react-hooks` + `jsx-a11y` + `import` (order).
- **Prettier** explicit `prettier.config.mjs` (wire the already-installed tailwind class-sort plugin).
- **Pre-commit**: `husky` + `lint-staged` → `eslint --fix` + `prettier` + `tsc --noEmit` on staged files.
- **Tests**: **Vitest** + RTL (Zod schemas, `ActionResult` logic, `requireAdmin`, form validation — incl. a test proving the forged-role request is rejected) and **Playwright** e2e (login, role enforcement, CRUD, contact form).
- **CI** `.github/workflows/ci.yml`: install → `tsc --noEmit` → lint → `vitest run` → `next build` → Playwright (test DB / `mongodb-memory-server`), Node 20.
- **Docs**: real `README`; `.env.example` generated from `lib/env.ts` (single source of truth).
- **Logging abstraction (candidate, deferred from Phase 2)**: Phase 2 deliberately kept a plain `console.error("<fn> failed:", …)` in catch blocks (YAGNI). If the server logs later need structure / levels / redaction, add a small `lib/logger.ts` here and route the action + route-handler catches through it.

*The lint/prettier/husky config can be pulled earlier (right after Phase 0) for guardrails during the migration; keep tests/CI here so they assert the final TS + Next 16 shape.* **Verify:** lint/typecheck/vitest/playwright green locally; PR CI green; a bad commit is blocked by husky.

---

## Phase 6 — i18n completion + frontend polish (P1/P2) · ~3–5 days

- **i18n**: expand `messages/en.json`/`tr.json` from 2 keys to full coverage; extract ~95% hardcoded strings (Navbar, Footer, `HeroWavy`, About, forms, ~30 Zod messages) into namespaced keys via `useTranslations`/`getTranslations`; move Zod messages into schema factories taking `t` so validation localizes.
- **State consolidation**: standardize on **zustand**; port the inbox jotai atom (`use-mail.jsx`) to a small store; **delete** dead `stores/counter-store.js`, `components/Counter.jsx`, the broken-import `stores/mailStore.js`, and jotai from deps.
- **RSC-by-default**: remove needless `"use client"` (~55/90 files — `Footer`, static content) leaf-up; keep it only where hooks/handlers/`useSession`/framer-motion/dropzones need it.
- **Error/loading boundaries**: add `error.tsx` at `app/[locale]/` and `(dashboard)/` + root `global-error.tsx`; replace manual `if(!data)` blocks with `Suspense` + the existing `loading.jsx` files. This also covers the Phase 2-surfaced fragility where `app/[locale]/about/page.jsx` does `members?.map(...)`, which throws if `getMembers` returns its `{ error }` shape on a getter DB failure (see `phase2/db-env-hardening.md`).
- **a11y**: skip link + real `<main>` landmark on the public layout; `aria-current` on active nav; consistent `htmlFor`/`id`; descriptive `alt`; `rel="noopener noreferrer"` on external links; guard `AccountMenu` name access.
- **DRY dropzones**: extract a shared `useImageDropzone` hook/base; the three variants become thin wrappers. Extract the copy-pasted responsive-width `useEffect`.
- **Images**: replace raw `<img>` with `next/image` (remote patterns already in `next.config.mjs`).

**Verify:** EN/TR toggle switches every visible string incl. validation errors; keyboard-only tab-through + skip link; error boundaries render on a thrown error; removed state lib absent from the bundle; axe/Lighthouse a11y pass; `npm run build`.

---

## Phase 7 — Migrate npm → pnpm (P2, final step) · ~0.5 day

Swap the package manager from npm to **pnpm** once the dependency tree has fully settled. Placed **last, after Phase 6**, deliberately: Phases 1/4/5/6 each mutate `package.json` + the lockfile (Better Auth swap, Next 16/React 19 bump, test/lint tooling, jotai removal). Converting after they land means **one** lockfile migration and **one** CI repoint instead of repeated npm↔pnpm churn or cross-phase lockfile conflicts. Independently shippable and fully revertible (restore `package-lock.json`, delete `pnpm-lock.yaml`).

- **Pin the toolchain**: `corepack enable`; add `"packageManager": "pnpm@10.x"` to `package.json` (exact version+hash pinned by corepack) so every environment — local, CI, and Vercel — resolves the same pnpm.
- **Convert the lockfile losslessly**: `pnpm import` (reads `package-lock.json` → seeds `pnpm-lock.yaml`, preserving resolved versions), then delete `package-lock.json` and run `pnpm install` to finalize. Commit `pnpm-lock.yaml`.
- **Handle strict linking (phantom deps)**: pnpm's non-flat `node_modules` surfaces any undeclared/phantom dependency (candidates: EdgeStore, Radix, next-intl transitives). **Fix by declaring the real dependency**, not by masking it. Add `.npmrc` with `shamefully-hoist=true` only as a documented last resort if a dep genuinely can't resolve under strict linking.
- **Repoint Phase 5 CI** (`.github/workflows/ci.yml`): add `pnpm/action-setup`, switch `actions/setup-node` cache to `pnpm`, replace `npm ci` → `pnpm install --frozen-lockfile` (fails on a lockfile/`package.json` mismatch — the reproducibility guarantee) and `npm run <x>` → `pnpm <x>`. Local dev keeps plain `pnpm install`, which is allowed to update the lockfile.
- **Repoint husky/lint-staged** (Phase 5) and any script that shells out to `npm`.
- **Vercel deploy**: no config change needed — Vercel auto-detects pnpm from the committed `pnpm-lock.yaml` + `packageManager` field and installs with frozen-lockfile semantics by default. Verify the first post-migration deploy build resolves under pnpm's strict linking (same phantom-dep check as CI); if a dep only breaks on Vercel, the fix is the same (declare the real dep, `.npmrc` hoist as last resort).
- **Update docs**: CLAUDE.md **Commands** section (`pnpm dev`/`pnpm build`/`pnpm lint`), README, and the `.env.example` generation command — all npm invocations → pnpm.

**Verify:** fresh `pnpm install --frozen-lockfile` clean from a wiped `node_modules`; `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` all green; GitHub Actions CI green on pnpm; the Vercel preview deploy builds green under pnpm; `git status` shows `pnpm-lock.yaml` committed and no `package-lock.json`; grep the repo for stray `npm run` / `npm ci` invocations.

---

## Effort roll-up

| Phase | Scope | Effort |
|---|---|---|
| 0 | Security hotfix (JS, on next-auth) | 0.5–1 d |
| 1 | Better Auth migration (new files TS) | 3–5 d |
| 2 | DB/env hardening | 1–1.5 d |
| 3 | Full TypeScript migration | 3–5 d |
| 4 | Next 16 / React 19 | 2–3 d |
| 5 | Tooling / tests / CI | 2–3 d |
| 6 | i18n + frontend polish | 3–5 d |
| 7 | Migrate npm → pnpm | 0.5 d |
| **Total** | | **~16–24 days** |

**Dependencies:** Phase 1 depends on Phase 0's server-side role derivation (so the swap doesn't reintroduce the vuln) and Phase 2's cached connection (pull forward for the `Db`). Phase 3 depends on Phase 1 (type against final auth). Phase 4's codemod runs after Phase 3. Phases 5–6 want the final TS/Next-16 shape (except Phase 5's lint/format config, which can move earlier). Phase 7 (pnpm) is strictly last: it repoints Phase 5's CI/husky commands and needs the dependency tree fully settled, so it lands after every dep-mutating phase; it is independently revertible.

## Critical files

- `app/api/auth/[...nextauth]/route.js` → replaced by `app/api/auth/[...all]/route.ts` + `lib/auth.ts` + `lib/auth-client.ts`
- `actions/{userActions,memberAction,workAction}.js` — the P0 role-parameter fix (all three)
- `app/api/user/route.js`, `app/api/email/route.js`, `app/api/email/count/route.js` — API auth guards
- `app/[locale]/(dashboard)/layout.jsx` — the single server-side admin enforcement chokepoint
- `middleware.js` → `middleware.ts` — next-auth+next-intl → Better Auth (optimistic) + next-intl
- `lib/database.js` — cached connection + source of the native `Db` for Better Auth
- `lib/env.ts`, `lib/authGuard.js`→`.ts`, `scripts/migrations/migrate-to-better-auth.ts` — new
- `package.json` (`packageManager` field), `package-lock.json` → `pnpm-lock.yaml`, `.npmrc` (new, conditional), `.github/workflows/ci.yml` (repoint) — Phase 7 pnpm migration

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
