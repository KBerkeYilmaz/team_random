#!/usr/bin/env node
// Fails if any CLAUDE.md (the root one or a nested/waterfall one) references a
// repo file that no longer exists.
//
// WHY: CLAUDE.md names key files as a map for agents (e.g. `lib/authGuard.ts`).
// When those files are renamed/moved/deleted, the doc silently goes stale — the
// exact class of drift this check prevents. It backs the "keep CLAUDE.md current"
// mandate (Mandatory rule 1) with something mechanical, so a PR that renames a
// referenced file without updating the doc fails CI instead of merging stale.
//
// WHAT IT CHECKS: backtick tokens that look like a file path (ending in a known
// code/doc extension). A token WITH a slash must resolve to that exact path; a
// bare filename (no slash, e.g. `navigation.ts`, `layout.tsx`) must match some
// tracked file's basename — so a real but nested `layout.tsx` passes, while a
// truly dangling `oldname.ts` fails. Skipped as ambiguous/not-a-path: bare
// extensions (`.ts`), globs, Next route-group/dynamic segments (`*`, `[...]`,
// `(group)`), and URLs. Run from the repo root (`npm run check:docs`).

import fs from "node:fs";
import { execSync } from "node:child_process";

const FILE_EXT = /\.(tsx?|jsx?|mjs|cjs|json|md|css)$/;
const NON_PATH = /[\s*()[\]]|\.\.\.|[→←]/; // globs / route groups / prose arrows
const BARE_EXT = /^\.[a-z0-9]+$/i; // a token that is *only* an extension, e.g. `.ts`

// Tracked files (respects .gitignore) → exact-path and basename sets.
const tracked = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const paths = new Set(tracked);
const basenames = new Set(tracked.map((p) => p.split("/").pop()));

// Every tracked CLAUDE.md — the root one plus any nested (waterfall) docs.
// Each names paths repo-root-relative, so they resolve the same way everywhere.
const DOCS = tracked.filter(
  (f) => f === "CLAUDE.md" || f.endsWith("/CLAUDE.md"),
);

const missing = [];
let checked = 0;

for (const doc of DOCS) {
  if (!fs.existsSync(doc)) {
    console.error(`check-doc-paths: doc not found: ${doc}`);
    process.exit(2);
  }
  const src = fs.readFileSync(doc, "utf8");
  for (const m of src.matchAll(/`([^`]+)`/g)) {
    const t = m[1];
    if (!FILE_EXT.test(t) || NON_PATH.test(t) || BARE_EXT.test(t)) continue;
    if (t.startsWith("http")) continue;
    checked++;
    const ok = t.includes("/")
      ? paths.has(t) || fs.existsSync(t)
      : basenames.has(t) || fs.existsSync(t);
    if (!ok) missing.push({ doc, token: t });
  }
}

if (missing.length) {
  console.error("✗ A CLAUDE.md references files that don't exist:\n");
  for (const { doc, token } of missing) {
    console.error(`  - \`${token}\`  (in ${doc})`);
  }
  console.error(
    "\nUpdate the reference to the current path (or fix the path). " +
      "See CLAUDE.md Mandatory rule 1: keep this doc current.",
  );
  process.exit(1);
}

console.log(
  `✓ check-doc-paths: all ${checked} file path(s) referenced in ${DOCS.join(", ")} exist.`,
);
