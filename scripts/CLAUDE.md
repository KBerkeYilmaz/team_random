# scripts/ — standalone tooling (NOT application code)

Guidance for anything under `scripts/`. Read this before adding or editing a script here.

Everything in `scripts/` is **build/CI/dev-time tooling** — run by a developer or a
CI job via Node/`tsx`, in a full environment (filesystem, `git`, network as needed).
**None of it is part of the Next.js app**: it is never `import`ed by `app/`,
`components/`, `lib/`, `actions/`, etc., never bundled by `next build`, and **never
runs on Vercel's serverless/edge runtime.** So `node:fs`, `child_process`,
`git ls-files`, top-level `await`, etc. are all fine here — the serverless `fs`
caveats that apply to app code do **not** apply to these scripts.

## Layout — one subfolder per purpose

- **`adhoc/`** — ad-hoc maintenance & CI helper scripts (idempotent, safe to re-run,
  no DB writes). Example: `scripts/adhoc/check-doc-paths.mjs` — fails if the root `CLAUDE.md`
  references a file that no longer exists (wired into `.github/workflows/docs-check.yml`
  and `npm run check:docs`).
- **`migrations/`** — one-time data/schema migrations, run **manually** against a DB
  copy (they mutate data). Example: `scripts/migrations/migrate-to-better-auth.ts` — the
  bcrypt-preserving next-auth → Better Auth migration (see
  `docs/migration/phase1/better-auth.md`).

## Conventions

- **Put a new script in the right subfolder** (`adhoc/` or `migrations/`) — do not
  drop standalone scripts at `scripts/` root. If a new category is genuinely needed,
  add a sibling folder and document it here.
- **Prefer zero-dependency** scripts (Node built-ins) where practical so CI needs no
  install step.
- **Migrations are manual + idempotent**: guard against double-application, and
  document the exact run command in the script header + the relevant phase doc.
- **Prod-affecting scripts are dry-run by default; writes require `--apply`.** Any
  script that can mutate **production** data must default to a **dry run** — read and
  print exactly what it *would* change, touching nothing — and perform writes only
  when passed an explicit `--apply` flag. Print which mode is active and (for DB
  scripts) the resolved `db.databaseName`, so an operator sees the target before
  committing. Rationale: the `team_random_webApp` prod-DB gotcha (a missing URI path
  segment silently points at the empty `test` db) makes a blind write dangerous; a
  mandatory dry run surfaces the wrong target first. Reference: issue #159 Part B3.
  `scripts/migrations/migrate-to-better-auth.ts` is the reference implementation.
- If you add/rename/move a script, update its references (docs, `package.json`,
  workflows, and the examples above) in the **same** PR — same rule as the root
  `CLAUDE.md`.
