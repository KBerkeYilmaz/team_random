// Phase 3 (TypeScript): ambient declaration so side-effect CSS imports
// (`import "./globals.css"`) in the now-TypeScript layouts type-check under strict.
// Next.js handles the actual CSS bundling; this only satisfies `tsc --noEmit`.
declare module "*.css";
