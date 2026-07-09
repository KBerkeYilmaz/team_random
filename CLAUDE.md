# CLAUDE.md

Guidance for Claude Code (and any AI agent) working in this repository. Read this before starting a task.

## Project overview

**team-random** is a Next.js 14 (App Router) portfolio / agency site: a public marketing site plus an admin-only dashboard for managing works, team members, and a contact inbox. Built May 2024; being modernized to 2026 standards (see **Modernization** below).

- **Framework:** Next.js 14 (App Router), React 18. **TypeScript** (`.ts`/`.tsx`) as of Phase 3 — only the dead trio (`components/Counter.jsx`, `stores/counter-store.js`, `stores/mailStore.js`, deleted in Phase 6) and the `postcss`/`tailwind` configs remain `.js`.
- **Data:** MongoDB via Mongoose (cached connection in `lib/database.ts`). Models in `models/`: `member`, `work` (the legacy `user` Mongoose model was dropped in Phase 1 — Better Auth now owns the `user`/`account` collections).
- **Auth:** Better Auth (email/password over MongoDB; existing bcrypt hashes preserved from the legacy next-auth data). Role-based (`admin` / `user`) via the admin plugin. **Authorization is derived from the server session** — `lib/authGuard.ts` → `requireAdmin()` and `auth.api.getSession()` (`lib/auth.ts`); never trust a client-supplied role. The dashboard is admin-only, enforced server-side in its layout. (Replaced next-auth v4 in Phase 1 — PR #88.)
- **Uploads:** EdgeStore (`lib/edgestore.ts`). **Email:** Gmail SMTP for the contact form + IMAP for the inbox, via `nodemailer` / `imapflow`.
- **i18n:** next-intl (`config.ts`, `navigation.ts`, `i18n.ts`, `messages/en.json` + `messages/tr.json`) — most strings are still hardcoded (addressed in Phase 6).
- **State:** zustand + jotai (to be consolidated in Phase 6). **UI:** Tailwind + shadcn/ui (`components/ui/`) + Radix + Framer Motion.

### Layout
- `actions/` — server actions (`"use server"`): `memberAction`, `workAction`, `userActions`, `emailAction`.
- `app/[locale]/` — routes; the `(dashboard)/` route group is the admin area, gated server-side in its `layout.tsx`.
- `app/api/` — route handlers: `auth/[...all]` (Better Auth), `user`, `email`, `email/count`, `edgestore/[...edgestore]`.
- `components/` (+ `forms/`, `ui/`), `lib/`, `models/`, `middleware.ts`.

### Commands
- `npm run dev` — dev server (needs env vars + a reachable MongoDB).
- `npm run build` — production build (to fully complete it also needs EdgeStore keys + a DB).
- `npm run lint` — ESLint. NOTE: the config is currently broken (`Failed to load config "next/babel"`); Phase 5 replaces it with flat config.

### Environment (nothing committed; `.env*.local` is gitignored)
All env vars are validated once at boot in **`lib/env.ts`** (Zod, fail-fast, server-only) — import `env` from there, never read `process.env` directly. **Required:** `MONGO_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_EMAIL`, `APP_PASSWORD`, `EDGE_STORE_ACCESS_KEY`, `EDGE_STORE_SECRET_KEY`. **Optional (defaults in `lib/env.ts`):** `NEXT_PUBLIC_API_BASE_URL` (`http://localhost:3000`), `IMAP_HOST` (`imap.gmail.com`), `IMAP_PORT` (`993`), `SALT_ROUNDS` (`10`).

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
- End commit messages with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

### Verify empirically
Do not assert that something works — show it (a build, tests, or a real run). Prefer additive diffs; do not churn working code.

## Mandatory rules

### 1. Keep the plan and phase state current — work must be self-contained, with no leakage
If your work is part of the modernization plan (`docs/migration/plan.md`), you **must** leave its state unambiguous before you finish:
- Update `docs/migration/plan.md` and the relevant `docs/migration/phaseN/` docs to reflect exactly what was done, and tick the phase in epic **#81**.
- Keep each phase **contained**: its code, its verification, and its docs travel together. A fresh agent with no memory of the session must be able to read `docs/migration/` alone and know precisely what is done, what is in flight, and what is next.
- Canonical state lives in **committed docs**, not in chat history or the gitignored `.context/` (which is workspace-local and ephemeral). Do not leave a phase half-documented or its status scattered.
- **Keep this CLAUDE.md current too — prefer pointing over copying.** Any change that renames/moves/deletes a file this doc references, or changes phase scope, must update the affected Project-overview / Modernization / Layout lines in the **same** PR (or note them deferred). Before finishing, grep CLAUDE.md for any old path you changed. Don't reintroduce a duplicated phase-status list — link to `docs/migration/` instead (see Modernization above). `npm run check:docs` (and CI) verifies every file path named here still exists.

### 2. Self-correction rule
If, while completing a task, you discover that your correct / working approach contradicts an instruction in this CLAUDE.md or in any skill prompt, **flag the discrepancy to the user in your final answer.** Then ask whether they would like you to open a PR to `main` that fixes or improves the incorrect instruction. Do not silently follow an instruction you have found to be wrong, and do not silently ignore it.
