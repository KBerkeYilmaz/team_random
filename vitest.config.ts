// vitest.config.ts
// Test-runner configuration for the Phase 4b unit-test suite (issue #153 — the
// first automated tests in this repo). Kept intentionally minimal: it wires up
// only what a Next 14 + TypeScript project needs before Vitest can run, and
// nothing else.
//
// Why each option is here (all load-bearing — do not drop one without
// re-checking what breaks):
//
//   resolve.alias  →  the `@/*` path mapping
//     Vitest/Vite do not read tsconfig's `paths` on their own, so tests (and the
//     modules they import) would fail to resolve `@/lib/...`, `@/actions/...`,
//     etc. We mirror tsconfig's `@/* -> ./*` mapping here.
//
//     A precise `^@/` **regex** (not a bare "@" string alias) is deliberate: it
//     rewrites only specifiers that begin with `@/…` and never touches scoped
//     npm packages such as `@testing-library/react` or `@hookform/resolvers`
//     (the character after their `@` is a letter, not `/`, so the regex can't
//     match them). A naive string alias of "@" would clobber those and break the
//     test imports.
//
//     (This replaces the `vite-tsconfig-paths` plugin the plan sketched: that
//     plugin declares `vite` as a peer dependency, and the only vite that
//     installs cleanly against this repo's pinned `@types/node@20.12.4` is vite
//     6, while Vitest 3 bundles vite 7 internally. The resulting split tree
//     type-checks as two incompatible `Plugin` types and fails `tsc`. Resolving
//     `@/` with Vitest's own built-in alias needs no external plugin, no second
//     vite, and no version pinning — see docs/migration/phase4 for the full
//     rationale.)
//
//   esbuild: { jsx: "automatic" }
//     REQUIRED. tsconfig sets `jsx: "preserve"` because Next's own SWC/Babel
//     pipeline is what transforms JSX at build time. Vitest transpiles test
//     files with esbuild, which would inherit `preserve` and emit raw,
//     un-executable JSX (the RTL test would throw at import). Forcing the
//     automatic React runtime makes esbuild do the JSX transform itself for the
//     test run only — the production build output is untouched.
//
//   test.environment: "node"
//     The default, stated for clarity. Most targets (the Zod schemas,
//     requireAdmin) are pure logic and run fastest in Node. The one RTL file
//     opts into jsdom per-file via a `// @vitest-environment jsdom` docblock on
//     its first line — we deliberately avoid `environmentMatchGlobs`, which is
//     deprecated in Vitest 3.
//
//   test.globals: false
//     No auto-injected describe/it/expect; every test file imports them from
//     "vitest" explicitly. This keeps both ESLint (no undefined-global errors,
//     so eslint.config.mjs needs no change) and the whole-project `tsc` happy
//     with zero extra tsconfig `types` entry.
//
//   test.setupFiles: ["./vitest.setup.ts"]
//     Registers the jest-dom matchers — see that file for why it lives at the
//     repo root and is imported once globally.
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Absolute path to the repo root (trailing slash), used by the `@/…` alias.
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: `${root}$1` }],
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
  },
});
