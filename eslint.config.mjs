// ESLint 9 "flat config" for team-random (Phase 4a — tooling guardrails).
//
// WHY THIS FILE EXISTS: the old `.eslintrc.json` extended `next/babel` — a Babel
// *preset*, not an ESLint config — so `next lint` crashed with "Failed to load
// config next/babel" before it checked a single line. Lint was effectively dead.
// This replaces the legacy eslintrc with ESLint 9's flat config and gives the
// repo a working, meaningful lint again. Run it with `npm run lint` (`eslint .`),
// NOT `next lint` (deprecated in Next 16 and it does not cleanly consume flat
// config on Next 14).
//
// WHY eslint-config-next 15 ON A NEXT 14 APP (deviation from the phase plan, which
// asked for config-next 14.2.35 to match `next`): eslint-config-next 14 bundles a
// pre-ESLint-9 plugin set — its `@rushstack/eslint-patch` (1.10.2) hard-throws on
// ESLint 9, and its `eslint-plugin-react` (7.34) calls `context.getFirstTokens`,
// an API ESLint 9 removed — so `next/core-web-vitals` cannot even load, let alone
// run, under ESLint 9. eslint-config-next 15.x drops the rushstack patch and ships
// eslint-9-compatible plugins (react 7.37, jsx-a11y 6.10, import 2.32), installs
// with no peer-dep override, and its @next/next rules are Next-version-agnostic
// best practices that lint a Next 14 app fine. Phase 5's Next 16 codemod realigns
// config-next to 16 (matching `next` again). See phase4/tooling-tests-ci.md.
//
// COMPOSITION (order matters — later entries win on conflicts):
//   1. ignores                         — never lint build output / generated files.
//   2. js.configs.recommended          — core JS correctness rules.
//   3. typescript-eslint recommended   — TS correctness rules. On Next 14 this is
//      our stand-in for `next/typescript`, which only ships in eslint-config-next
//      15+; we deliberately do NOT extend `next/typescript` here (its Next-15 TS
//      rules are Phase 5's call) — typescript-eslint gives equivalent coverage.
//   4. next/core-web-vitals VIA FlatCompat — eslint-config-next has no native flat
//      build, so it is a legacy "extends" string; FlatCompat is the documented
//      bridge. This one entry REGISTERS and configures the @next/next, react,
//      react-hooks, jsx-a11y and import plugins with Next's curated rules — so we
//      layer onto those plugins below rather than re-registering them (flat config
//      forbids defining a plugin name twice).
//   5. extra rules on the already-registered plugins: the FULL jsx-a11y recommended
//      ruleset (Next only enables a curated a11y subset) + an auto-fixable
//      `import/order` (kept a warning so it never blocks a commit; `--fix` sorts).
//   6. CommonJS config-file override (tailwind/postcss legitimately use require()).
//
// PASSING ON A NEVER-LINTED TREE: rules stay at recommended severity (errors are
// errors — an unused import fails lint, which is the regression the guardrail
// catches). The ~99 pre-existing findings are captured in a committed
// `eslint-suppressions.json` baseline (generated with `eslint --suppress-all`), so
// `npm run lint` is green today while any NEW violation still fails. Later phases
// burn the baseline down (dead-code/`any` cleanup; a11y in the frontend-polish
// phase); regenerate it with `npm run lint -- --suppress-all` after a batch.

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));

// FlatCompat lets a flat config consume classic "extends"-style shareable configs
// (here: eslint-config-next, which has no native flat build).
const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
  // 1. Global ignores — build artifacts and generated files are never source.
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "build/**",
      "out/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },

  // 2. Core JS recommended.
  js.configs.recommended,

  // 3. typescript-eslint recommended (the `next/typescript` equivalent on Next 14).
  ...tseslint.configs.recommended,

  // 4. Next.js core-web-vitals (registers @next/next + react-hooks + jsx-a11y +
  //    import plugins with Next's curated rules) via FlatCompat.
  ...compat.extends("next/core-web-vitals"),

  // 5. Extra rules layered onto the plugins registered in (4). We reference the
  //    "jsx-a11y/*" and "import/*" namespaces WITHOUT re-declaring the plugins.
  {
    rules: {
      // Full jsx-a11y recommended set (broader than Next's curated subset).
      ...jsxA11y.configs.recommended.rules,
      // Deterministic, auto-fixable import ordering (warning, never blocks).
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // 6. CommonJS config files legitimately use require() — the TS rule forbidding it
  //    does not apply to them (they are not ESM/TS source).
  {
    files: ["*.config.js", "postcss.config.js", "tailwind.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
