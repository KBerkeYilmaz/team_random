#!/usr/bin/env bash
#
# guard-main.sh — PreToolUse(Bash) guardrail: refuse `git commit` / `git push`
# while the current branch is a protected branch (main or master).
#
# ─── WHY THIS EXISTS ────────────────────────────────────────────────────────
# The single most important written rule in this repo is CLAUDE.md → "Working
# conventions → Git": **Never commit to `main`.** Until now that rule was
# enforced only by (a) human discipline and (b) GitHub branch protection on the
# server. This hook adds a third, *local* layer: it stops an agent from ever
# running the commit/push in the first place, with an actionable message,
# before the mistake reaches the remote. It is the deterministic counterpart to
# a rule that was previously advisory prose.
#
# ─── CONTRACT ───────────────────────────────────────────────────────────────
# Claude Code invokes this as a PreToolUse hook with matcher "Bash" and pipes
# the tool-call JSON on stdin: {"tool_name":"Bash","tool_input":{"command":...}}
#   • exit 0            → allow (defer to the normal permission flow)
#   • exit 2 + stderr   → BLOCK the tool call; stderr is surfaced to the agent
# (See .claude/settings.json → hooks.PreToolUse, and CLAUDE.md → "The .claude
# harness" for the wiring and rationale.)
#
# ─── DESIGN NOTES ───────────────────────────────────────────────────────────
#   1. FAIL-OPEN, on purpose. Any parse failure, a missing `node`, a detached
#      HEAD, or an unrecognised git invocation lets the command through. This
#      hook is a safety NET, never the sole gate — GitHub branch protection and
#      CI (build-check / docs-check) remain the hard enforcement. A guard that
#      failed *closed* could brick every commit if a dependency hiccuped.
#   2. CHEAP ON THE HOT PATH. matcher "Bash" runs this before EVERY shell
#      command, so the common (non-git) case must cost ~nothing: two in-shell
#      substring tests reject it with zero subprocesses. `node` — guaranteed in
#      this Next.js repo, so no `jq` dependency that a CI image might lack — is
#      only spawned for commands that already look like a git commit/push.
#   3. PRECISION. We extract tool_input.command and match `commit`/`push` as a
#      real git *subcommand* at a shell-statement boundary, so a commit MESSAGE
#      that merely contains the word "push" does not cause a spurious block, and
#      compound commands (`cd x && git commit …`) are still caught. Exotic
#      invocations (e.g. `git -c k=v commit`) may fall through to the server
#      gate — acceptable given note 1.
#
set -euo pipefail

input="$(cat)"

# 1) Fast path — the vast majority of Bash calls are neither commit nor push.
#    In-shell glob tests short-circuit before any subprocess is spawned.
case "$input" in *git*) ;; *) exit 0 ;; esac
case "$input" in *commit*|*push*) ;; *) exit 0 ;; esac

# 2) Precisely pull the command string out of the tool-call JSON on stdin.
#    node is guaranteed here; `|| true` keeps us fail-open if it is not.
command="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).tool_input?.command ?? ""))}catch{process.stdout.write("")}})' 2>/dev/null || true)"

# 3) Is `commit`/`push` an actual git subcommand at a statement boundary
#    (start of line, or after ; & |), optionally preceded by global flags?
if ! printf '%s' "$command" | grep -Eq '(^|[;&|])[[:space:]]*git([[:space:]]+-[^[:space:]]+)*[[:space:]]+(commit|push)([[:space:]]|$)'; then
  exit 0
fi

# 4) Block only on a protected branch. Detached HEAD / errors → fail-open.
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
case "$branch" in
  main|master)
    echo "guard-main: blocked a git commit/push on protected branch '$branch'." >&2
    echo "CLAUDE.md rule #1 — never commit or push to $branch. Create a feature" >&2
    echo "branch off origin/main (convention: <issue#>-<slug>) and retry there." >&2
    exit 2
    ;;
esac
exit 0
