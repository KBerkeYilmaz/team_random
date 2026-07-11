#!/usr/bin/env bash
#
# check-docs-on-claudemd.sh — PostToolUse(Write|Edit) doc-drift guard.
#
# ─── WHY THIS EXISTS ────────────────────────────────────────────────────────
# This repo maintains an 11-file CLAUDE.md "waterfall" whose #1 mandatory rule
# is "keep the docs current". The mechanical half of that rule — that every
# file path a CLAUDE.md names in backticks still resolves — is enforced in CI
# by `npm run check:docs` (scripts/adhoc/check-doc-paths.mjs, wired into
# .github/workflows/docs-check.yml). This hook runs that SAME validator locally
# the moment a CLAUDE.md is edited, so a dangling path is caught in seconds by
# the agent that wrote it, instead of a round-trip to CI. It is the local
# mirror of the docs-check gate.
#
# ─── CONTRACT ───────────────────────────────────────────────────────────────
# Claude Code invokes this as a PostToolUse hook (matcher "Write|Edit") and
# pipes the tool-call JSON on stdin. The edited path is at tool_input.file_path
# (Write/Edit) or tool_response.filePath.
#   • exit 0            → nothing to report
#   • exit 2 + stderr   → check:docs failed; the reason is surfaced to the agent
#                          as a nudge to fix the dangling reference now.
#
# ─── DESIGN NOTES ───────────────────────────────────────────────────────────
#   1. Only fires real work for actual CLAUDE.md edits. matcher "Write|Edit"
#      runs this after EVERY file write, so a cheap in-shell substring test
#      rejects the common case with zero subprocesses; `node` parses the exact
#      edited path only when "CLAUDE.md" appears in the payload, and we then
#      confirm the *edited file* (not merely its contents) is a CLAUDE.md.
#   2. Low false-positive rate: check-doc-paths.mjs treats an on-disk file as
#      existing (fs.existsSync fallback), so referencing a not-yet-committed
#      file does not trip it — only a genuinely missing path does.
#   3. Advisory, not authoritative. CI's docs-check remains the enforced gate;
#      this is fast feedback. It exits 2 (feeds the reason back to the agent)
#      rather than silently, because the whole point is to prompt an immediate
#      fix. If a team finds it too eager mid-multi-file-edit, it is a one-line
#      removal from settings.json.
#
set -euo pipefail

input="$(cat)"

# 1) Fast path — skip unless a CLAUDE.md is plausibly involved at all.
case "$input" in *CLAUDE.md*) ;; *) exit 0 ;; esac

# 2) Confirm the EDITED FILE is a CLAUDE.md (not just content that mentions it).
file="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(String(j.tool_input?.file_path ?? j.tool_response?.filePath ?? ""))}catch{process.stdout.write("")}})' 2>/dev/null || true)"
case "$file" in
  */CLAUDE.md|CLAUDE.md) ;;
  *) exit 0 ;;
esac

# 3) Run the same validator docs-check CI runs, from the project root.
if ! out="$(cd "${CLAUDE_PROJECT_DIR:-.}" && npm run --silent check:docs 2>&1)"; then
  echo "check:docs failed after editing $file — a CLAUDE.md now references a path that does not exist:" >&2
  echo "$out" >&2
  echo "Fix the reference to the current path (CLAUDE.md rule #1: keep the docs current)." >&2
  exit 2
fi
exit 0
