# CLAUDE.md

Guidance for Claude Code (and any AI agent) working in this repository. Read this before starting a task.

## Project overview

**team-random** is a Next.js 14 (App Router) portfolio / agency site: a public marketing site plus an admin-only dashboard for managing works, team members, and a contact inbox. Built May 2024; being modernized to 2026 standards (see **Modernization** below).

- **Framework:** Next.js 14 (App Router), React 18. **TypeScript** (`.ts`/`.tsx`) as of Phase 3 — only the dead trio (`components/Counter.jsx`, `stores/counter-store.js`, `stores/mailStore.js`, slated for deletion in a later cleanup phase) and the `postcss`/`tailwind` configs remain `.js`.
- **Data:** MongoDB via Mongoose (cached connection in `lib/database.ts`). Models in `models/`: `member`, `work` (the legacy `user` Mongoose model was dropped in Phase 1 — Better Auth now owns the `user`/`account` collections).
- **Auth:** Better Auth (email/password over MongoDB; existing bcrypt hashes preserved from the legacy next-auth data). Role-based (`admin` / `user`) via the admin plugin. **Authorization is derived from the server session** — `lib/authGuard.ts` → `requireAdmin()` and `auth.api.getSession()` (`lib/auth.ts`); never trust a client-supplied role. The dashboard is admin-only, enforced server-side in its layout. (Replaced next-auth v4 in Phase 1 — PR #88.)
- **Uploads:** EdgeStore (`lib/edgestore.ts`). **Email:** Gmail SMTP for the contact form + IMAP for the inbox, via `nodemailer` / `imapflow`.
- **i18n:** next-intl (`config.ts`, `navigation.ts`, `i18n.ts`, `messages/en.json` + `messages/tr.json`) — most strings are still hardcoded (addressed in the i18n phase).
- **State:** zustand + jotai (to be consolidated in a later phase). **UI:** Tailwind + shadcn/ui (`components/ui/`) + Radix + Framer Motion. **Gotcha:** keep Tailwind's `content` globs in `tailwind.config.js` at `.{js,ts,jsx,tsx,mdx}` — the Phase 3 TS migration left them at `.{js,jsx}`, so Tailwind scanned none of the `.tsx` sources, generated no utilities, and the whole site rendered as unstyled HTML on a bare background (regression fixed in PR #120).

### Layout
- `actions/` — server actions (`"use server"`): `memberAction`, `workAction`, `userActions`, `emailAction`.
- `app/[locale]/` — routes; the `(dashboard)/` route group is the admin area, gated server-side in its `layout.tsx`.
- `app/api/` — route handlers: `auth/[...all]` (Better Auth), `user`, `email`, `email/count`, `edgestore/[...edgestore]`.
- `components/` (+ `forms/`, `ui/`), `lib/`, `models/`, `middleware.ts`.
- `scripts/` — standalone build/CI/dev tooling, **never app code** (not bundled, never on Vercel): `adhoc/` (maintenance & CI helpers) + `migrations/` (one-time data migrations). See [`scripts/CLAUDE.md`](scripts/CLAUDE.md).

**Per-folder `CLAUDE.md` (the waterfall).** Most top-level source folders carry their own `CLAUDE.md` with folder-local conventions and gotchas — general project context lives here, folder-specific context lives in-folder and is auto-surfaced when you work in that subtree. Read a folder's doc before editing it: [`actions/CLAUDE.md`](actions/CLAUDE.md), [`app/CLAUDE.md`](app/CLAUDE.md) (+ [`app/api/CLAUDE.md`](app/api/CLAUDE.md)), [`components/CLAUDE.md`](components/CLAUDE.md) (+ [`components/ui/CLAUDE.md`](components/ui/CLAUDE.md), [`components/forms/CLAUDE.md`](components/forms/CLAUDE.md)), [`lib/CLAUDE.md`](lib/CLAUDE.md), [`models/CLAUDE.md`](models/CLAUDE.md), and [`messages/CLAUDE.md`](messages/CLAUDE.md). Each follows the same keep-current rule as this file — `npm run check:docs` validates the file paths every `CLAUDE.md` names.

### Commands
- `npm run dev` — dev server (needs env vars + a reachable MongoDB).
- `npm run build` — production build (to fully complete it also needs EdgeStore keys + a DB).
- `npm run lint` — ESLint 9, flat config (`eslint.config.mjs`); `lint:fix` auto-fixes. `npm run format` / `format:check` — Prettier (`prettier.config.mjs`). A husky pre-commit hook (`.husky/pre-commit`) runs lint-staged + whole-project `tsc --noEmit`. Pre-existing lint findings are baselined in `eslint-suppressions.json` (new violations still fail). Fixed in **Phase 4a** — the old config extended the `next/babel` Babel preset and crashed on load. CI does not yet run lint (deferred to Phase 4d).
- `npm run test` — Vitest unit tests (`vitest run`; `test:watch` for watch mode); config in `vitest.config.ts` / `vitest.setup.ts`. Added in **Phase 4b** (the repo's first tests); not yet wired into CI (deferred to Phase 4d).
- **Conductor workspaces:** `.conductor/settings.toml` provisions each new workspace — `setup = npm ci` at creation time (so `node_modules` is ready before your first command) plus a concurrent per-port `run.dev` (`next dev` on `$CONDUCTOR_PORT`) for parallel live previews. Needs a root `.env.local` (Conductor copies `.env*` into every new workspace) for `dev`/`build`; a gitignored `.conductor/settings.local.toml` can mirror it for instant local effect before this merges.

### Environment (nothing committed; `.env*.local` is gitignored)
All env vars are validated once at boot in **`lib/env.ts`** (Zod, fail-fast, server-only) — import `env` from there, never read `process.env` directly. **Required:** `MONGO_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_EMAIL`, `APP_PASSWORD`, `EDGE_STORE_ACCESS_KEY`, `EDGE_STORE_SECRET_KEY`. **Optional (defaults in `lib/env.ts`):** `NEXT_PUBLIC_API_BASE_URL` (`http://localhost:3000`), `IMAP_HOST` (`imap.gmail.com`), `IMAP_PORT` (`993`), `SALT_ROUNDS` (`10`). The committed **`.env.example`** template enumerates all of these (secrets blank, non-secret config pinned) — copy it to `.env.local` and fill in the blanks, then mirror into Vercel.

## Modernization (the current effort)

A phased modernization is under way, tracked by epic **#81**. **Phase status, scope, and the phase list are NOT duplicated here — read them at their source:** [`docs/migration/README.md`](docs/migration/README.md) (the phase index: status + PR links), [`docs/migration/plan.md`](docs/migration/plan.md) (the authoritative scope & sequencing), and each `docs/migration/phaseN/` write-up. Do not re-add a parallel status list to this file — that copy is what goes stale.

## Working conventions

### Git
- **Never commit to `main`.** Branch off the latest `origin/main` using the repo convention `<issue#>-<slug>` (e.g. `82-security-hotfix`).
- **Atomic, conventional commits** — one logical change per commit (`feat(...)`, `fix(...)`, `refactor:` …). Rule of thumb: if the message needs the word "and", it is probably two commits.
- **One PR per phase**, opened with `--base main`; the PR body closes its tracking issue (`Closes #N`).
- **One PR = one issue.** Every PR must revolve around a single issue/concern — never bundle unrelated changes into one PR (this generalizes the per-phase rule above). Open a separate issue + PR for each distinct concern.
- **Minimal, focused diffs.** Change only what the issue requires; keep edits surgical and additive. Do not churn, reformat, or refactor unrelated code in the same PR.
- **Surface new concerns; don't smuggle them in.** If, mid-task, you discover a new issue/bug/cleanup whose fix would breach the minimal-diff / one-PR-one-issue rule, **pause and ask the user** whether to open a separate issue + PR for it (the default) or fold it into the current one. Never silently bundle an unrelated change, and never silently drop the finding.
- **Before opening the PR, run `/doc-sync`.** After your changes are made and before you open/merge, the `doc-sync` skill (`.claude/skills/doc-sync/SKILL.md`) walks the `CLAUDE.md` waterfall, `docs/migration/`, and the touched issue/PR/epic, reconciling whatever the change made stale and printing an auditable summary so the next agent fits in seamlessly. It is the **semantic** counterpart to the mechanical `npm run check:docs` — run both.
- End commit messages with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

### Verify empirically
Do not assert that something works — show it (a build, tests, or a real run). Prefer additive diffs; do not churn working code.

### The `.claude` harness
The repo ships a small, **committed, team-shared** Claude Code harness so every teammate and CI agent inherits the same guardrails (like the already-committed `doc-sync` skill). Improve it here rather than in a per-developer, gitignored settings.local.json. Each piece encodes a rule already written down elsewhere in these docs; the verbose rationale lives in the files themselves.

- **`.claude/settings.json`** — a permissions allowlist that auto-approves safe, high-frequency commands (read-only git, the `npm run lint` / `typecheck` / `build` / `check:docs` gates, `gh pr view` / `gh issue view`, and file edits) while leaving destructive/outward-facing operations (`git commit` / `push`, network, `gh pr create` / `merge`) to prompt — plus the two hooks below and the `.mcp.json` pre-approval.
- **`.claude/hooks/guard-main.sh`** (PreToolUse / Bash) — refuses `git commit` / `git push` while on `main`/`master`, turning the "Never commit to `main`" rule above into a deterministic local block. Fail-open safety net; GitHub branch protection + CI stay the hard gate.
- **`.claude/hooks/check-docs-on-claudemd.sh`** (PostToolUse / Write|Edit) — after any `CLAUDE.md` edit, runs `npm run check:docs` locally, mirroring the `docs-check` CI gate so path drift is caught before the PR.
- **`.claude/agents/security-reviewer.md`** and **`.claude/agents/convention-reviewer.md`** — read-only, dispatchable subagents that audit a diff against the documented auth invariants and the documented conventions, respectively (each file carries its own checklist).
- **`.mcp.json`** — pins the `context7` (live dependency docs) and `shadcn` (registry) MCP servers so they work without per-developer wiring. The **vercel** MCP server is intentionally left per-developer (HTTP + individual OAuth) — authorize it with `/mcp` in an interactive session rather than committing it.

## Mandatory rules

### 1. Keep the plan and phase state current — work must be self-contained, with no leakage
If your work is part of the modernization plan (`docs/migration/plan.md`), you **must** leave its state unambiguous before you finish:
- Update `docs/migration/plan.md` and the relevant `docs/migration/phaseN/` docs to reflect exactly what was done, and tick the phase in epic **#81**.
- Keep each phase **contained**: its code, its verification, and its docs travel together. A fresh agent with no memory of the session must be able to read `docs/migration/` alone and know precisely what is done, what is in flight, and what is next.
- Canonical state lives in **committed docs**, not in chat history or the gitignored `.context/` (which is workspace-local and ephemeral). Do not leave a phase half-documented or its status scattered.
- **Keep this CLAUDE.md current too — prefer pointing over copying.** Any change that renames/moves/deletes a file this doc references, or changes phase scope, must update the affected Project-overview / Modernization / Layout lines in the **same** PR (or note them deferred). Before finishing, grep CLAUDE.md for any old path you changed. Don't reintroduce a duplicated phase-status list — link to `docs/migration/` instead (see Modernization above). `npm run check:docs` (and CI) verifies every file path named here still exists.
- **Operationalize all of the above with `/doc-sync`** (see Working conventions → Git): run it after your changes and before the PR to reconcile the whole doc graph — module + root `CLAUDE.md`s, `docs/migration/`, and the touched issue/PR/epic, not just the migration docs. `check:docs` is the mechanical floor (paths resolve); `doc-sync` is the semantic pass (claims still agree; checkboxes / `Closes #N` / phase status still true).

### 2. Self-correction rule
If, while completing a task, you discover that your correct / working approach contradicts an instruction in this CLAUDE.md or in any skill prompt, **flag the discrepancy to the user in your final answer.** Then ask whether they would like you to open a PR to `main` that fixes or improves the incorrect instruction. Do not silently follow an instruction you have found to be wrong, and do not silently ignore it.
