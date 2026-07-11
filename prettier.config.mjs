// Prettier config for team-random (Phase 4a — tooling guardrails).
//
// Deliberately MINIMAL: the codebase already matches Prettier v3's defaults
// (double quotes, semicolons, trailing commas, 2-space indent — see lib/env.ts),
// so we set no formatting options and only wire in the already-installed
// class-sorting plugin. Keeping defaults means the one-time `prettier --write .`
// diff stays modest.
//
// prettier-plugin-tailwindcss sorts Tailwind utility classes into Tailwind's
// recommended order; it auto-detects tailwind.config.js, so no extra option.

/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
