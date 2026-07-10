---
name: doc-sync
description: "Reconcile the repository's documentation graph with a change before it ships. Run after making code or doc changes and before opening or merging a PR: it walks the CLAUDE.md waterfall (module → root), the docs/migration plan/README/phase docs, and the touched issue/PR/epic, fixing whatever the change made stale and printing an auditable summary. The semantic counterpart to the mechanical `npm run check:docs` path check — run both."
---

# doc-sync — reconcile the doc graph before shipping

Keep the documentation graph **truthful and self-consistent** as changes land, so a
fresh agent can trust the docs without re-deriving them from the code. This is the
*semantic* half of "keep the docs current" (root `CLAUDE.md` → Mandatory rule 1). The
*mechanical* half — that every file path a `CLAUDE.md` names still resolves — is
enforced by `npm run check:docs` (`scripts/adhoc/check-doc-paths.mjs`) in CI. They
catch different drift; run both.

## When to run

The last step of the ship path: **after** your changes are made, **before** you open
or merge the PR. Also any time you suspect the docs and reality have diverged.

## What "in sync" means

A doc node is in sync when nothing in your change contradicts what it asserts:

- **Paths** it names still exist — mechanical, deferred to `check:docs`.
- **Claims** it makes are still true: conventions, gotchas, commands, layout, env
  vars, and (for modernization work) phase scope / status / sequencing.
- **Tracking state** is accurate: issue acceptance criteria, a PR body's `Closes #N`,
  epic checkboxes, "X is done / Y is next" lines.
- **No duplicated fact** silently disagrees with its copy elsewhere.

## Adjudicating drift — which doc wins

When two docs already disagree and no change of yours caused it, don't pick the
better-written one. Split it into two questions, answered in order.

**1. Which is *true right now*?** A doc is a claim *about* an artifact, never the
artifact itself — so resolve toward the artifact. Which artifact depends on the fact's
type:

- **State** (what *is*: "Phase 3 shipped", "env lives in `lib/env.ts`") → the **code /
  git / merged PRs / closed issues**. Immutable, timestamped, can't drift from itself.
- **Intent** (what we *plan*: "Phase 4 = tooling") → the **latest deliberate
  decision** (the thing doesn't exist yet, so code can't judge). A doc that
  self-declares supersession ("reshaped 2026-07-09; others to follow") is announcing
  it's the newer authority — believe it.
- **Rationale** (*why*: "we deferred Prisma because…") → the **human / decision
  record**; if unclear, ask.

Recency alone is not authority: a newer doc that merely *copies* is not more true than
the source it copied.

**2. Which should *own* the fact going forward?** Seat each fact in exactly one home —
the doc **closest to where it changes** (phase status → the migration README; env vars
→ `lib/env.ts`; layout → root `CLAUDE.md`). Make that owner correct, then turn every
other copy into a **pointer**, not a second assertion. Prefer to **generate or
mechanically check** a derived copy (that is what `check:docs` does) so it can't drift
again — and note that anything a mechanical check *can't* reach (a GitHub issue/PR
body) is the highest drift risk, so it should carry the least duplicated content.

**If no artifact can arbitrate** — two pure-intent claims, equally fresh, no decision
record — **do not guess; surface it.** Guessing launders an open question into false
certainty (root `CLAUDE.md` → "surface new concerns; don't smuggle them in").

## Procedure

### 1. Map the change surface

- Get the diff you're about to ship: `git diff origin/main...HEAD` (committed) plus
  `git status` / `git diff` (uncommitted). List every changed / added / renamed /
  deleted path.
- Extract the *facts a doc might assert*: renamed or deleted files, new files that
  belong in a layout list, changed commands/scripts, new or removed env vars, changed
  conventions or gotchas, and anything touching modernization phase scope or status.
- For a large or cross-cutting diff, dispatch an Explore agent to find every doc node
  that could reference the touched surface instead of scanning by hand.

### 2. Walk the waterfall — nearest first

Visit each node, fix in place with a **minimal** edit, and record the outcome. Stop
climbing once the change no longer reaches the next level up.

1. **Module `CLAUDE.md`** — for each changed file, the `CLAUDE.md` in its folder (or
   nearest ancestor). Does the change contradict a folder-local convention, gotcha, or
   file list? A new file that belongs in a list? A renamed path (backticked *or* in
   prose)?
2. **Root `/CLAUDE.md`** — only if the change crosses module boundaries, touches a
   path / command / env var it names, or changes project overview, layout, or
   modernization scope. Prefer *pointing* to the module doc over copying content up.
3. **`docs/migration/` (README + `plan.md` + `phaseN/`)** — if the change is part of
   the modernization plan or alters phase status, scope, or sequencing. Keep the phase
   index (README), the authoritative scope (`plan.md`), and the per-phase write-up
   mutually consistent.
4. **Other READMEs / docs** the change touches.
5. **Tracking issue + PR body + epic** — only the ones *this* change touches.
   Reconcile: acceptance criteria met, `Closes #N` correct, epic box ticked, phase
   status line accurate. Do **not** audit the whole tracker.

### 3. Prefer single-source over reconcile

Use **Adjudicating drift** (above) to decide which copy is true and which should own
the fact — then act on it. If the same fact lives in two places and they disagree,
don't just fix both copies —
make one canonical and have the other **point** at it (e.g. an epic links
`docs/migration/README.md` for status instead of re-listing phases). Every duplicated
fact is future drift. If a safe de-dup is bigger than this change should carry,
surface it as a follow-up issue rather than leaving two copies (root `CLAUDE.md` →
"surface new concerns; don't smuggle them in").

### 4. Verify the mechanical floor

Run `npm run check:docs`. It must pass — no `CLAUDE.md` may name a path that no longer
exists. Fix any dangling reference it reports.

### 5. Emit an auditable summary

End with a checklist of every node you visited and what happened, so the reviewer and
the next agent can trust the sync at a glance:

```
doc-sync summary
- components/forms/CLAUDE.md .... updated — listed NewFooForm
- root CLAUDE.md ............... no change needed
- docs/migration/README.md .... updated — Phase 4 → In progress
- docs/migration/plan.md ...... no change needed
- issue #142 .................. acceptance criteria still accurate
- PR body ..................... updated — Closes #142
- epic #81 .................... ticked Phase 4 box
- npm run check:docs .......... ✓ passing
```

State anything you deliberately **skipped** and why (out of scope, needs its own
issue). A silent omission reads as "nothing to sync" when there was something.

## Scope & guardrails

- **CLAUDE.md waterfall + repo docs:** whole-repo — every affected node.
- **Issues / PRs / epic:** only the ones this change touches.
- **Minimal diffs:** don't reformat or rewrite docs beyond what the change requires —
  the same surgical-diff rule that governs code.
- **Complements, never replaces, `check:docs`.** The CI check is the deterministic
  floor; this skill is the judgment layer on top.
