# Phase 4 — Tooling, Tests, CI

**Status: 🚧 In progress** — part of epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81),
tracked by umbrella issue [#144](https://github.com/KBerkeYilmaz/team_random/issues/144).
Shipping as **four focused slices**, each its own issue + branch + PR (decision locked with the
user: a phase this large ships as focused PRs under an umbrella issue rather than one mega-PR).

| Slice | Concern | Issue | Status |
|---|---|---|---|
| **4a** | Tooling guardrails — ESLint 9 flat config, Prettier, husky + lint-staged | [#145](https://github.com/KBerkeYilmaz/team_random/issues/145) | ✅ Shipped — PR [#146](https://github.com/KBerkeYilmaz/team_random/pull/146) |
| **4b** | Unit tests — Vitest + RTL (`requireAdmin` forged-role, Zod schemas, `ContactForm`) | [#153](https://github.com/KBerkeYilmaz/team_random/issues/153) | ✅ this PR |
| 4c | E2E — Playwright (login, role enforcement, CRUD, contact) + `mongodb-memory-server` | _tbd_ | Not started |
| 4d | CI + docs — wire lint/vitest/playwright into CI; real README; generated `.env.example` | _tbd_ | Not started |

Phase 4 was pulled **ahead of the Next 16 bump** (Phase 5) by the 2026-07-09 reshape so the tests
exist as a regression net for that upgrade. This doc is extended in 4b–4d.

> **Numbering note.** `plan.md`'s detailed section for this work is still titled **"Phase 5 —
> Tooling, tests, CI"** (pre-reshape 0–7 numbering; renumber tracked in
> [#142](https://github.com/KBerkeYilmaz/team_random/issues/142)). `README.md` (Phases 0–9) is
> canonical; this is **reshaped Phase 4**.

---

## Slice 4a — Tooling guardrails (shipped, PR #146)

### Problem it addresses

The repo had **no regression net** at the tooling layer:

- **Lint was dead.** `.eslintrc.json` extended `next/babel` — a **Babel preset, not an ESLint
  config** — so `next lint` crashed (`Failed to load config "next/babel"`) before checking a
  single line.
- **Prettier was installed but unconfigured** (`^3.2.5` + `prettier-plugin-tailwindcss`, unused).
- **No git hooks** — nothing stopped a badly-formatted or lint-erroring commit.

### What shipped (per commit)

| Commit | Scope |
|---|---|
| `build(eslint): replace broken next/babel config with ESLint 9 flat config` | ESLint 9 + `eslint.config.mjs`; `lint` → `eslint .`; `lint:fix`; delete `.eslintrc.json`; committed `eslint-suppressions.json` baseline. |
| `build(prettier): add Prettier config, ignore file, and format scripts` | `prettier.config.mjs` (wires the Tailwind class-sort plugin), `.prettierignore`, `format`/`format:check` scripts. |
| `style: format the codebase with Prettier (one-time, mechanical)` | Isolated `prettier --write .` over 97 source files (76 tsx / 16 ts / 2 mjs / 2 js / 1 json). No logic change. |
| `build(husky): add husky + lint-staged pre-commit guardrail` | husky v9 + lint-staged; `prepare: husky`; `.husky/pre-commit` = lint-staged then whole-project `tsc --noEmit`. |
| `docs(migration): document Phase 4a …` | This doc + README/plan/CLAUDE reconciliation. |
| `fix(eslint): fix the auto-fixable findings instead of baselining them` | Review follow-up: `prefer-const`/`no-var` fixed in source + pruned from the baseline (decision 3). |
| `build(eslint): lint .jsx and all pre-commit extensions; drop redundant globs` | Review follow-up: `.jsx` linted, pre-commit eslint covers `.js/.mjs/.cjs`, redundant CommonJS globs trimmed. |

### The ESLint flat config (`eslint.config.mjs`)

Composed with `typescript-eslint`'s `config()` helper:

1. `ignores` — `.next`, `node_modules`, `build`, `out`, `coverage`, `next-env.d.ts`.
2. `js.configs.recommended` (core JS).
3. `typescript-eslint` recommended (TS correctness).
4. `next/core-web-vitals` **via `FlatCompat`** (eslint-config-next has no native flat build; this
   one entry registers the `@next/next` + `react` + `react-hooks` + `jsx-a11y` + `import` plugins
   with Next's curated rules).
5. Full `jsx-a11y` recommended + `import/order` (warning) **layered onto** the plugins registered
   in (4) — flat config forbids re-declaring a plugin name.
   - Plus a `**/*.jsx` registration with JSX parsing — the default flat set is js/cjs/mjs and
     (2)–(4) add ts/tsx, so a plain `.jsx` file (e.g. `components/Counter.jsx`) would otherwise be
     **silently unlinted**.
6. A CommonJS-config override: `require()` is legitimate in `tailwind.config.js` / `postcss.config.js`,
   so `@typescript-eslint/no-require-imports` is off for those files (matched by `*.config.js`).

### Key decisions & deviations from the plan (flagged per the self-correction rule)

1. **eslint-config-next `14.1.4` → `^15.5.7`, NOT the plan's `14.2.35`.** This is the load-bearing
   deviation. eslint-config-next **14** bundles a **pre-ESLint-9 plugin set** that cannot run under
   ESLint 9:
   - its `@rushstack/eslint-patch` (1.10.2) **hard-throws** on ESLint 9 ("only tested with ESLint
     6.x/7.x/8.x"), so `next/core-web-vitals` won't even load; and
   - its `eslint-plugin-react` (7.34) calls `context.getFirstTokens`, an API **ESLint 9 removed**,
     so `react/display-name` crashes mid-lint.

   Forcing config-next 14 onto ESLint 9 needs a cascade of transitive `overrides` fighting the whole
   pinned ecosystem. eslint-config-next **15.x** instead drops the rushstack patch, ships
   eslint-9-compatible plugins (react 7.37, jsx-a11y 6.10, import 2.32), **installs with no
   peer-dep override**, and its `@next/next` rules are Next-version-agnostic best practices that lint
   a Next 14 app fine. **Phase 5's Next 16 codemod realigns config-next to 16** (matching `next`
   again), at which point this is a non-issue.

2. **`typescript-eslint` recommended stands in for `next/typescript`.** The plan listed
   `next/typescript`, which only ships in eslint-config-next 15+. We deliberately do **not** extend
   `next/typescript` here (its Next-15 TS rules are Phase 5's call); typescript-eslint's recommended
   config gives equivalent TS coverage on Next 14.

3. **`eslint-suppressions.json` baseline instead of a mega-cleanup.** The first-ever lint of a
   never-linted tree found ~94 pre-existing errors. The **auto-fixable** ones (`prefer-const` ×5,
   `no-var` ×1) are **fixed in source, not baselined** — otherwise the pre-commit `eslint --fix`
   would rewrite the suppressed line, make the suppression unused, and fail the *next* lint (ESLint
   exits non-zero on stale suppressions). The remaining **89 non-auto-fixable findings** (64
   `no-unused-vars`, plus `no-explicit-any`, `no-empty`, and a handful of `jsx-a11y` — including the
   one in `components/Counter.jsx`, now that `.jsx` is linted) are captured in a committed baseline
   generated with ESLint 9's native `eslint --suppress-all`. **Rules stay strict (errors are
   errors)** — any NEW violation still fails lint (verified) — while `npm run lint` is green today.
   Later phases burn the baseline down (dead-code/`any` cleanup — the phase3 doc already deferred
   these here; a11y in the frontend-polish phase). Regenerate after a cleanup batch with
   `npm run lint -- --suppress-all`, or drop a single fixed finding with `--prune-suppressions`.

4. **Prettier scope: code yes, Markdown no.** The plan expected a "modest" format diff; in reality
   **97 source files** differed (chain re-wrapping + Tailwind class sorting). The one-time
   `prettier --write .` is isolated in its own `style:` commit (plan-sanctioned), verified
   behaviour-preserving (`tsc` + `next build` + `eslint` all stay green after it). Markdown is
   **excluded** via `.prettierignore`: Prettier pads every Markdown table column, producing large,
   low-value diffs across the hand-maintained CLAUDE.md waterfall + `docs/migration`, and it would
   collide with the doc edits this very slice makes. `messages/*.json`, `package-lock.json`,
   `eslint-suppressions.json`, and `.context`/`.claude` are excluded too.

5. **husky under a git worktree.** This workspace is a `git worktree`; husky v9's `prepare` sets
   `core.hooksPath=.husky/_` in the shared repo config and the relative path resolves per-worktree.
   Verified: the hook fires and blocks a bad commit here.

6. **lint-staged covers every linted extension; Markdown stays out.** `eslint --fix` + `prettier`
   run on staged `*.{ts,tsx,js,mjs,cjs,jsx}` (matching what `eslint .` lints), and `prettier` alone
   on `*.{json,css}`. Markdown is Prettier-ignored (decision 4), so it is in neither glob — keeping
   the two consistent.

### Verification (empirical — CLAUDE.md)

1. **`npm install`** — clean, no `--legacy-peer-deps`, no overrides. Resolved `typescript@6.0.3`
   (see flag below), `typescript-eslint@8.63.0`, `eslint@9.39.5`, `eslint-config-next@15.5.20`.
2. **`npm run lint`** — **passes** (was a hard crash). Proof it lints: adding an unused import
   makes it **fail** (`@typescript-eslint/no-unused-vars`, error), reverting restores green.
3. **`npm run format:check`** — passes after the one-time format commit.
4. **Pre-commit hook** — staging a file with a new unused var makes `git commit` fail
   (`husky - pre-commit script failed (code 1)`, lint-staged reverts); fixing it lets the commit
   through. Directly satisfies the plan's "a bad commit is blocked by husky".
5. **`npm run typecheck`** clean; **`npm run build`** green (7/7 static pages; Tailwind class
   reordering did not change the build).
6. **`npm run check:docs`** — passes (the new phase4 doc paths resolve).

### Flags surfaced (don't smuggle)

- **`typescript: ^6.0.3` is real, not a stray edit.** The plan flagged it as possibly anomalous
  (should maybe be `^5.x`). `npm install` resolves it to a genuine published **6.0.3**, and
  `typecheck`/`build` are green — so **no separate issue is needed**; it stands.
- **`.github/workflows/build-check.yml` comment updated.** Its comment claimed the ESLint config is
  "known-broken (next/babel)" and would be fixed in "Phase 5". Lint is now fixed, so the comment was
  factually wrong; it is corrected to point at flat config and note the **CI lint step lands in
  slice 4d** (workflow behaviour unchanged — 4a does not touch CI).
- **CI stays lint-free until 4d.** `build-check.yml` still runs only `typecheck` + `next build`;
  wiring `lint` + tests into CI is 4d's job (and 4d must **extend `build-check.yml` in place** — the
  required status check is the **job name** `typecheck-and-build`; renaming it breaks branch
  protection).
- **`.env.example` (#115) reconciliation is 4d's**, per the umbrella issue.

---

## Slice 4b — Unit tests (this PR)

### Problem it addresses

4a gave the repo a tooling floor but **still zero tests** — no Vitest/RTL/jsdom, no `test` script,
nothing to catch a regression in the security-critical `requireAdmin()` guard or in the shared Zod
schemas. 4b adds the first automated tests, establishing the harness and patterns that 4c
(Playwright E2E) and 4d (CI wiring) build on.

### Approach — B (pure-logic tests + one RTL smoke test)

Most targets are pure logic and are tested by direct calls in Vitest's node environment. Exactly
**one** React Testing Library test renders a real form (`ContactForm`) in jsdom — a deliberate,
spec-noted reading of the issue's literal "Vitest + RTL". We do **not** RTL-render every form; that
is low-ROI and largely redundant with the schema tests (see Flags).

### What shipped (per commit)

| Commit | Scope |
|---|---|
| `build(vitest): add Vitest + Testing Library harness and test scripts` | Vitest 3 + jsdom + Testing Library (react/dom/jest-dom/user-event) dev deps; `vitest.config.ts` + `vitest.setup.ts`; `test` / `test:watch` scripts. |
| `refactor(schemas): extract contact/login/edit-user schemas into actions/schemas.ts` | Move the last inline form schemas into the shared `actions/schemas.ts`; rewire ContactForm/LoginForm/EditUserForm; single-source the EditUser/updateUser pair. |
| `test: add unit tests for requireAdmin, shared Zod schemas, and ContactForm` | The three suites (23 tests). |
| `docs(migration): document Phase 4b …` | This section + README/CLAUDE reconciliation. |

### The harness (`vitest.config.ts` / `vitest.setup.ts`)

- **Path aliases via Vitest's built-in `resolve.alias`, derived from tsconfig `paths`** (each
  mapping → a precise `^prefix` regex) — **not** the `vite-tsconfig-paths` plugin the plan sketched
  (see the load-bearing deviation below). _(4b shipped this as a single hard-coded `@/` alias;
  refined in #160 to read tsconfig at config-load so the two auto-sync.)_
- **`esbuild: { jsx: "automatic" }`** — required because tsconfig is `jsx: "preserve"` (Next's
  SWC/Babel transforms JSX at build time); without it esbuild would emit un-executable JSX.
- **`test.environment: "node"`** (the fast default); the single RTL file opts into jsdom via a
  first-line `// @vitest-environment jsdom` docblock (no deprecated `environmentMatchGlobs`).
- **`test.globals: false`** — every test imports `describe/it/expect/vi` explicitly, so **no**
  `eslint.config.mjs` or tsconfig `types` change is needed.
- **`vitest.setup.ts`** imports `@testing-library/jest-dom/vitest` once, registering the DOM
  matchers and making their type augmentation visible to the whole-project `tsc`.

### The three suites (colocated with source)

- **`lib/authGuard.test.ts` — the crown jewel.** `vi.hoisted` + `vi.mock("@/lib/auth", …)` (so the
  real Better Auth `MongoClient` / fail-fast `@/lib/env` never load) + `vi.mock("next/headers", …)`.
  Asserts `requireAdmin()` rejects a no-session request **and** a forged `role:"user"` session, and
  returns the session unchanged for `role:"admin"`. This is the regression net for AUDIT #83.
- **`actions/schemas.test.ts`.** Table-driven valid/invalid for every shared schema
  (member/updateMember/work, `updatePasswordSchema`'s min(8) boundary + `.refine`, and the newly
  extracted contact/login/editUser). Also asserts `updateMemberSchema` omits `memberImage` via
  `.shape` and that `editUserSchema` emits the canonical "User name…" message. Messages are read from
  `error.issues` (no `flatten().fieldErrors` index-signature friction). Zero mocks.
- **`components/forms/ContactForm.test.tsx`.** The one RTL smoke test: mounts the form in jsdom and
  proves empty-submit Zod messages surface as DOM text through the shadcn `<Form>`/`<FormMessage>`.

### Schema extraction + consolidation (the rider)

Extracting the inline schemas is the **prerequisite** for testing form validation as pure logic, so
it ships inside 4b (user-approved, not unrelated churn):

- New `contactSchema` / `loginSchema` / `editUserSchema` (+ inferred input types) in
  `actions/schemas.ts`, messages copied verbatim from the former inline definitions.
- `ContactForm` / `LoginForm` / `EditUserForm` consume the shared schemas; the now-unused
  `import { z }` is deleted from each.
- **EditUser/updateUser single-sourced** (mirrors the #126 password fix): `updateUser` drops its
  inline `userSchema` with the `{fullName,userMail}` remap and validates
  `editUserSchema.safeParse({name,email})`, typed `EditUserInput`. The `safeParse`-before-
  `requireAdmin()` ordering and the three baselined unused `id` params are preserved.

### Key decisions & deviations from the plan (flagged per the self-correction rule)

1. **`@/` alias via `resolve.alias`, NOT `vite-tsconfig-paths` — the load-bearing deviation.** That
   plugin declares `vite` as a **peer dependency**, and the only vite that installs cleanly against
   this repo's pinned `@types/node@20.12.4` is vite 6, while Vitest 3 bundles vite 7. The resulting
   split tree type-checks as two incompatible `Plugin` types and **fails the pre-commit
   `tsc --noEmit`**. Resolving `@/` with Vitest's built-in alias (a precise `^@/` regex that never
   clobbers scoped `@testing-library/*` packages) needs no external plugin, no second vite, and no
   version pinning — net **two fewer dev deps** than the plan (`vite`, `vite-tsconfig-paths`).
   _(Follow-up #160 keeps the plugin's auto-sync benefit by deriving the aliases from tsconfig
   `paths` at config-load via the TypeScript compiler API — still no new dependency.)_
2. **One user-visible behaviour change.** `EditUserForm`'s name-too-short message becomes the
   canonical **"User name must be at least 3 characters."** (was a copy-pasted "Member name…").
   Safe: `EditUserForm` reads only `result.error`, never the field-level `errors` map, so
   consolidating `updateUser`'s error keys onto `{name,email}` has no UI effect.
3. **RTL renders exactly one form (`ContactForm`), not all** — by design (Approach B).
4. **Coverage tooling (`@vitest/coverage-v8`) deferred to 4d** — no consumer until CI lands.
5. **A refactor (schema extraction) rides inside a testing slice** — the prerequisite for pure-logic
   form-validation tests, user-approved.

### Verification (empirical — CLAUDE.md)

1. **`npm install`** — clean, no `--legacy-peer-deps`. Resolved `vitest@3.2.7`, `jsdom@26.1.0`,
   `@testing-library/{react@16.3.2,dom@10.4.1,jest-dom@6.9.1,user-event@14.6.1}`.
2. **`npm run test`** — **green, 23/23** across the three suites. Proof it bites: temporarily
   weakening `requireAdmin`'s role check (dropping `role !== "admin"`) makes the forged-role test
   **fail** ("promise resolved … instead of rejecting"); restoring it goes green again.
3. **`npm run typecheck`** — clean (config + test files are in the program).
4. **`npm run lint`** + **`npm run format:check`** — clean. `eslint-suppressions.json` counts are
   **unchanged**: `userActions.ts` keeps its 3 `no-unused-vars` (the `id` params), `EditUserForm.tsx`
   its 1 `no-empty`; `ContactForm.tsx`/`LoginForm.tsx` are not baselined and stay lint-clean.
5. **`npm run build`** — green, 7/7 static pages (verified locally with a temporary dummy
   `.env.local`, since this workspace has no committed env; the app build is unaffected by 4b).
6. **`npm run check:docs`** — passes (the new 4b doc paths resolve).

### Files touched (4b)

- New: `vitest.config.ts`, `vitest.setup.ts`, `lib/authGuard.test.ts`, `actions/schemas.test.ts`,
  `components/forms/ContactForm.test.tsx`.
- Edited (code): `package.json` (+`package-lock.json`) dev deps & scripts; `actions/schemas.ts`
  (+3 schemas); `actions/userActions.ts` (`updateUser` → shared schema);
  `components/forms/{ContactForm,LoginForm,EditUserForm}.tsx` (consume shared schemas).
- Docs reconciled: this doc, `docs/migration/README.md`, `components/forms/CLAUDE.md`,
  `actions/CLAUDE.md`.

---

## Slices 4c–4d (sketched — own issues/PRs later)
- **4c (e2e):** Playwright with `mongodb-memory-server` + a seeded admin. Flows: login, dashboard
  redirect when logged-out/non-admin, member/work CRUD, contact form. EdgeStore + Gmail SMTP/IMAP
  stubbed (no creds in CI).
- **4d (CI + docs):** add `lint` + `vitest run` + Playwright to CI by **extending
  `build-check.yml`** (not renaming it); real root `README.md`; **generated** `.env.example` from
  `lib/env.ts`; reconcile open PR #115; optional `lib/logger.ts` (deferred from Phase 2).

## Files touched (4a)

- New: `eslint.config.mjs`, `eslint-suppressions.json`, `prettier.config.mjs`, `.prettierignore`,
  `.husky/pre-commit`, this doc.
- Deleted: `.eslintrc.json`.
- Edited (config/deps): `package.json` (deps, scripts, `lint-staged` config), `package-lock.json`.
- Reformatted (mechanical): 97 source files via `prettier --write .`.
- Docs reconciled: `docs/migration/{README.md, plan.md}`, `CLAUDE.md`,
  `.github/workflows/build-check.yml` (comment only).

## References

- [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files) ·
  [FlatCompat](https://eslint.org/docs/latest/use/configure/migration-guide#using-eslintrc-configs-in-flat-config) ·
  [ESLint bulk suppressions](https://eslint.org/docs/latest/use/suppressions) ·
  [typescript-eslint](https://typescript-eslint.io/getting-started) ·
  [husky](https://typicode.github.io/husky/) · [lint-staged](https://github.com/lint-staged/lint-staged)
