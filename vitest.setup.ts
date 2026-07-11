// vitest.setup.ts
// Runs once before each test file (wired via `test.setupFiles` in
// vitest.config.ts). Registers @testing-library/jest-dom's custom DOM matchers
// (`toBeInTheDocument`, `toHaveTextContent`, …) on Vitest's `expect`.
//
// We import the `/vitest` entry point specifically: it is the Vitest-native
// build that imports `expect` from "vitest" and calls `expect.extend(...)`
// itself, so the matchers are available even though the suite runs with
// `globals: false`. Each test file still imports `expect` explicitly — it is the
// same singleton this setup file extended, so the augmented matchers are there.
//
// Importing it here (rather than inside the single jsdom test) also brings the
// matcher *type augmentation* into tsconfig's `include` glob, so the
// whole-project `tsc --noEmit` — including the husky pre-commit hook — sees the
// extended `Assertion` interface and typechecks the RTL assertions. Harmless in
// the default node environment: this import only extends `expect`; it touches no
// DOM until a DOM matcher is actually called (which only the jsdom test does).
import "@testing-library/jest-dom/vitest";
