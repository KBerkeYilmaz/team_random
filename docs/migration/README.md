# Migration Docs

Per-phase documentation for the **team-random** modernization to 2026 best practices
(tracking epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81)). One folder per phase.

**Full plan:** [plan.md](plan.md) — the complete 7-phase modernization plan (context, sequencing rationale, per-phase scope, effort, and critical files).

| Phase | Doc | Status |
|---|---|---|
| 0 — Security hotfix | [phase0/security-hotfix.md](phase0/security-hotfix.md) | ✅ Shipped — PR #83 |
| 1 — Better Auth (replaces next-auth v4) | [phase1/better-auth.md](phase1/better-auth.md) | ✅ Shipped — PR #88 |
| 2 — Database & env hardening | [phase2/db-env-hardening.md](phase2/db-env-hardening.md) | ✅ Shipped — PR #97 |
| 3 — Full TypeScript migration | _tbd_ | Not started |
| 4 — Next 16 / React 19 | _tbd_ | Not started |
| 5 — Tooling, tests, CI | _tbd_ | Not started |
| 6 — i18n completion + frontend polish | _tbd_ | Not started |

Each phase ships as its own PR off `main` and closes its phase issue. See the full plan at
[plan.md](plan.md).
