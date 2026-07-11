// vitest.config.ts
// Test-runner configuration for the Vitest suite (first added in Phase 4b,
// issue #153). Kept intentionally minimal: it wires up only what a Next 14 +
// TypeScript project needs before Vitest can run, and nothing else.
//
// Why each option is here (all load-bearing — do not drop one without
// re-checking what breaks):
//
//   resolve.alias  →  the tsconfig `paths` mapping(s), derived automatically
//     Vitest/Vite do not read tsconfig's `paths` on their own, so tests (and the
//     modules they import) would fail to resolve `@/lib/...`, `@/actions/...`,
//     etc. Rather than hand-copy the `@/* -> ./*` mapping here (which would then
//     silently drift if someone adds an alias to tsconfig), we READ tsconfig's
//     `compilerOptions.paths` and translate each mapping into a Vite alias — see
//     `aliasesFromTsconfigPaths()` below. Add a path mapping to tsconfig.json and
//     the tests pick it up with no edit here.
//
//     Each mapping becomes a precise `^<prefix>` **regex** (not a bare string
//     alias): `@/*` → `/^@\/(.*)$/`, which rewrites only specifiers beginning
//     `@/…` and never touches scoped npm packages like `@testing-library/react`
//     or `@hookform/resolvers` (the char after their `@` is a letter, not `/`).
//     A naive string alias of "@" would clobber those and break the test imports.
//
//     Why not the `vite-tsconfig-paths` plugin (which does exactly this)? It
//     declares `vite` as a peer dependency, and the only vite that installs
//     cleanly against this repo's pinned `@types/node@20.12.4` is vite 6, while
//     Vitest 3 bundles vite 7 internally. The resulting split tree type-checks as
//     two incompatible `Plugin` types and fails `tsc --noEmit` (the pre-commit
//     hook). Deriving the aliases ourselves gives the same auto-sync with **no**
//     extra dependency, no second vite, and no version pinning. We parse tsconfig
//     with the TypeScript compiler API (already a devDependency) so JSONC
//     comments are handled exactly as `tsc` reads them. See docs/migration/phase4.
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

import ts from "typescript";
import { defineConfig } from "vitest/config";

// Absolute path to the repo root (trailing slash) — the base each alias target
// resolves against.
const root = fileURLToPath(new URL(".", import.meta.url));

// Translate tsconfig's `compilerOptions.paths` into Vite `resolve.alias` entries,
// so the two stay in sync automatically. Reads tsconfig via the TypeScript API
// (comment-tolerant, same as `tsc`). Handles the wildcard form the repo uses
// (`"@/*": ["./*"]`); a non-wildcard exact mapping, if ever added, would need a
// small tweak here (and would fail loudly at import, never silently).
function aliasesFromTsconfigPaths() {
  const tsconfigPath = fileURLToPath(
    new URL("./tsconfig.json", import.meta.url),
  );
  const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const paths: Record<string, string[]> = config?.compilerOptions?.paths ?? {};

  return Object.entries(paths).map(([pattern, [target]]) => {
    // "@/*"  → prefix "@/"  → find /^@\/(.*)$/   (the char after "@" must be "/")
    const prefix = pattern.slice(0, pattern.indexOf("*"));
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // "./*"  → strip leading "./", anchor to repo root, swap the wildcard for $1
    const replacement = root + target.replace(/^\.\//, "").replace(/\*$/, "$1");
    return { find: new RegExp(`^${escaped}(.*)$`), replacement };
  });
}

export default defineConfig({
  resolve: {
    alias: aliasesFromTsconfigPaths(),
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
  },
});
