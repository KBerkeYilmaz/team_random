# Migration Docs

Per-phase documentation for the **team-random** modernization to 2026 best practices
(tracking epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81)). One folder per phase.

**Full plan:** [plan.md](plan.md) — the modernization plan (context, sequencing rationale, per-phase scope, effort, and critical files).

> **This table is the canonical phase index + status (Phases 0–9).** The roadmap was
> **reshaped 2026-07-09** (epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81)):
> tests/CI pulled ahead of the Next 16 bump, a Prisma-on-Postgres + tRPC data layer
> un-deferred, and the old "i18n + frontend polish" phase split in two. `plan.md`'s
> **detailed per-phase sections still use the pre-reshape 0–7 numbering** — renumbering
> them to match this table is tracked in
> [#142](https://github.com/KBerkeYilmaz/team_random/issues/142).

| Phase | Doc | Status |
|---|---|---|
| 0 — Security hotfix | [phase0/security-hotfix.md](phase0/security-hotfix.md) | ✅ Shipped — PR #83 |
| 1 — Better Auth (replaces next-auth v4) | [phase1/better-auth.md](phase1/better-auth.md) | ✅ Shipped — PR #88 |
| 2 — Database & env hardening | [phase2/db-env-hardening.md](phase2/db-env-hardening.md) | ✅ Shipped — PR #97 |
| 3 — Full TypeScript migration | [phase3/typescript-migration.md](phase3/typescript-migration.md) | ✅ Shipped — PR #103 |
| 4 — Tooling, tests, CI | [phase4/tooling-tests-ci.md](phase4/tooling-tests-ci.md) | 🚧 In progress — slice **4a** (tooling guardrails) shipping ([#145](https://github.com/KBerkeYilmaz/team_random/issues/145)); umbrella [#144](https://github.com/KBerkeYilmaz/team_random/issues/144) |
| 5 — Next 16 / React 19 | _tbd_ | Not started |
| 6 — Data layer: Prisma on Postgres + tRPC | _tbd_ | Not started |
| 7 — i18n completion | _tbd_ | Not started |
| 8 — Frontend polish | _tbd_ | Not started |
| 9 — Migrate npm → pnpm (final step) | _tbd_ | Not started |

Each phase ships as its own PR off `main` and closes its phase issue. See the full plan at
[plan.md](plan.md).
