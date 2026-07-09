# Phase 3 — Full TypeScript Migration

**Status: ✅ Shipped** (PR #103, closes #102) — part of epic [#81](https://github.com/KBerkeYilmaz/team_random/issues/81). Date: 2026-07-09.

Converts the codebase from JavaScript (`.js`/`.jsx`) to **TypeScript** (`.ts`/`.tsx`). **Type-only — no behaviour change.** The intended outcome: typed models, actions, and components so Phase 4's Next 16 / React 19 codemod lands on typed signatures.

## Constraints / approach

- **Leaf-up, file-by-file.** `allowJs:true` + `checkJs`-off means un-migrated `.js` stays unchecked, so every commit keeps `tsc --noEmit` **and** `next build` green. Foundation was already in place from Phase 1 (`tsconfig.json` with `strict`/`allowJs`/`moduleResolution:"bundler"`/`@/*` alias, plus 8 files already TS).
- **One phase PR** off `main`, composed of small **atomic leaf-up commits**, each independently green — this reconciles CLAUDE.md's one-PR-per-phase rule with plan.md's "small" intent.
- **108 files converted** (88 `.jsx` + 25 `.js`). The 3 dead files stay `.js`/`.jsx` (deleted in Phase 6); `postcss.config.js` + `tailwind.config.js` stay `.js`.
- **Verification is empirical:** every commit was checked with `tsc --noEmit` + `next build`, and the mechanical (component) conversions were additionally checked with a **string-literal audit** — the multiset of quoted strings (classNames, text) must be byte-identical old vs new, so only type annotations could have changed.

## Summary of problems this phase addresses

- Everything was untyped `.jsx`/`.js`: no compile-time safety on models, server-action params/returns, form values, or component props.
- Several **latent bugs** were only visible once types were added and are fixed here as forced/sanctioned edits (see below): a duplicate `header` key, a phantom `forwardRef` render param, getter-`{ error }` shapes leaking into `.map`/`.render`, a missing-arg dereference crash, date-fns v3 default imports, etc.

## What changed (per commit)

| Commit | Batch | Scope |
|---|---|---|
| `chore(ts): add typecheck script…` | 0 | `typecheck` npm script; `components.json "tsx": true`; devDeps `@types/{nodemailer,mailparser,react-dom@^18}`. `noUnusedLocals` deliberately **not** enabled. |
| `refactor(ts): convert data foundation…` | 1 | New `actions/types.ts` (permissive `ActionState`, Row types, `Lean<T>`) + `actions/schemas.ts` (shared Zod). Models (`IMember`/`IWork`), leaf libs, `navigation`/`i18n`/`fonts`, EdgeStore `route.ts`↔`lib/edgestore.ts` (router type). |
| `fix(actions): correct copy-pasted entity names…` | 2a | Behaviour-preserving cleanup (folded from Phase 2's "observed" list): `workAction` error strings said "member"; dropped unused `const result` bindings. Kept as `.js`. |
| `refactor(ts): convert server actions…` | 2b | `actions/{workAction,memberAction,userActions,emailAction}.ts`: `Promise<ActionState>`, `z.infer` params, honest getter unions, `(error as Error).message`. |
| `refactor(ts): convert API route handlers…` | 3 | `app/api/{user,email,email/count}/route.ts`: `Request` params, deleted dead `base-64` import, `+@types/imapflow`, imapflow `!` assertions. |
| `refactor(ts): convert shadcn ui/ primitives…` | 4 | 34 files: canonical `forwardRef` generics, `form.tsx`, generic `DataTable<TData,TValue>`, toast trio, custom animations. |
| `fix(i18n): widen @/navigation types…` | — | Type-only navigation fix (below). |
| `refactor(ts): convert the three image dropzones…` | 5 | `forwardRef<HTMLInputElement, InputProps>`, shared `FileState`, dropped phantom `gridCols` param, `progress:"PENDING" as const`. |
| `refactor(ts): convert shared components + theme-provider…` | 5 | 17 components (incl. live `CounterNumber`; `Counter.jsx` left dead). |
| `refactor(ts): convert forms…` | 6 | 8 forms: `useForm<z.infer<…>>`, shared schemas, typed `onSubmit`, `FileState`, edgestore `upload` `File` cast. |
| `refactor(ts): convert app pages, layouts, inbox and mail UI…` | 7 | 29 files: getter-union page guards, typed `ColumnDef`, `works/columns` dup-`header` fix, inbox/mail typing, `WorkFormData`, `globals.d.ts`. |

## Deviations from plan (flagged per the self-correction rule)

1. **`ActionState` is a permissive object, not a discriminated union.** plan.md sketched `ActionResult<T> = { data:T } | { error } | { errors }`, but no action returns `{ data }` and the forms read `.error`/`.message` by truthy-check (never `"error" in result`). The permissive `{ message?, error?, errors? }` is the faithful type-only shape; the discriminated-union refactor is deferred to **Phase 5/6** (once forms are reworked). Recorded in `actions/types.ts`.
2. **Getter-union page guards (sanctioned Phase 6 overlap).** Getters now return `Row | { error } | null`; each consuming page got a one-line guard that renders the *existing* fallback (`notFound()` / empty list / `0`). This closes latent crashes (e.g. `works/[id]` dereferenced `null`; `about` did `members?.map` on the `{ error }` shape) **without new UI**. `members/[id]` now `notFound()`s a missing id instead of showing a loader forever.
3. **Navigation typing fix (its own commit).** `config.ts`'s `pathnames` map declares only `/` and a **vestigial, unused** `/pathnames` (no such route; nothing links to it), so `createLocalizedPathnamesNavigation` typed `Link`/`usePathname`/`router.push` to that tiny union and rejected every real route. Rather than scatter ~15 casts, the runtime bindings are unchanged and only the exported **types** are widened (in `navigation.ts`) to the plain-string shape the routes are actually used as. A later phase should complete the `pathnames` map or switch to `createSharedPathnamesNavigation` and drop the widening.
4. **`WorkFormData`.** `works/[id]/page` passes a `filteredWork` subset (no timestamps, no `workContributors`) to `WorkDetails` → `EditWorkForm`; both props are typed `Omit<WorkDetail,"createdAt"|"updatedAt">` so the subset flows **and** the edit form's Contributors field keeps starting empty (prior behaviour), rather than pre-filling.
5. **Dead trio left as `.js`** (`Counter.jsx`, `stores/counter-store.js`, `stores/mailStore.js`) — never bundled + `checkJs`-off = green for free; Phase 6 deletes them.
6. **Added `@types/imapflow`** — the plan's `!`-assertion design assumes typed imapflow but Batch 0's dep list omitted it. Filled in Batch 3.
7. **plan.md wording fix** — "do it in small PRs" → "small atomic commits within the single phase PR" (this file's approach). Applied in `plan.md`.

## Forced, behaviour-preserving compiler edits

All preserve current runtime behaviour; the compiler required them:
- **`works/columns` duplicate `header` key** (TS1117) → dead sort-button block removed, `header:"Title"` kept (the string already won in JS).
- **Dead `base-64` import** in the email route → deleted (no `@types`, never used).
- **Dropzone phantom 3rd `gridCols` render param** → deleted (a 3-arg fn isn't a `ForwardRefRenderFunction`; never passed).
- **imapflow `seen:false` + `bodyParts:true`** — pre-existing options its typed query doesn't model (ignored at runtime) → passed verbatim via one documented cast.
- **sparkles `resize:true` / `effect.type:{}`** — tsparticles v2 shorthands v3 rejects → localized casts.
- **ContactForm bare `<FormLabel className>`** (= `className={true}`, a no-op clsx drops) → `className=""`.
- **EditWorkForm `width` prop on `MultiImageDropzone`** (which has no such prop; dropped at runtime) → removed the no-op.
- **date-fns v3** dropped default submodule exports → `import { format } from "date-fns/format"` (named).
- **mail subsystem**: the fetched inbox mails (numeric `uid` ids, optional fields) don't match the mock `Mail` type `MailList`/`MailDisplay` consume — a pre-existing mismatch (selection never matched). Cast once in `mail.tsx`, runtime unchanged; `fetchInbox`'s union is normalised with `Array.isArray` before `.map`.
- **`globals.d.ts`** (`declare module "*.css"`) added so the now-typed layouts' side-effect CSS imports satisfy `tsc`.

## Verification (empirical — CLAUDE.md)

- **`tsc --noEmit`** — fully clean on the whole strict project.
- **`next build`** — exit 0: compiles, passes type validation, and generates 7/7 static pages. All app routes are dynamic (`ƒ`) so the build needs no live DB; full page-data collection would still need a reachable MongoDB + real EdgeStore keys, which this workspace lacks — a **gitignored** dummy `.env.local` lets the build clear env validation. `tsc --noEmit` is the authoritative complete gate.
- **Inventory:** only `components/Counter.jsx`, `stores/counter-store.js`, `stores/mailStore.js`, `postcss.config.js`, `tailwind.config.js` remain non-TS.
- **String-literal audit:** for the mechanical component conversions, every quoted string (classNames, text) is byte-identical pre/post — only type annotations changed.
- **Smoke test (recommended before merge, needs env + DB):** public site + dashboard CRUD in both locales (en/tr); login → session → dashboard; create a member without an image; inbox as admin; contact form; confirm a forged-`role` action is still rejected (unchanged).

## Observed but intentionally out of scope (surfaced, not fixed)

- **Vestigial localized-`pathnames` config** (deviation #3): a later phase should either complete `config.ts`'s `pathnames` for all real routes or switch `navigation.ts` to `createSharedPathnamesNavigation` and drop the type-widening.
- **Discriminated-union `ActionResult<T>`** (deviation #1): deferred to Phase 5/6 with the form rework.
- **Mail subsystem shape mismatch**: fetched inbox mails vs the mock `Mail` type; selection is already broken (numeric vs string ids). Left as-is (type-only); a real fix belongs with the Phase 6 inbox/i18n work.
- **Client-component `console.log`s** and dead-code (`Counter`, stores, unused imports left by removed blocks) — Phase 5 (ESLint) / Phase 6.

## Files touched

- New: `actions/types.ts`, `actions/schemas.ts`, `globals.d.ts`, this doc.
- Renamed `.js`/`.jsx` → `.ts`/`.tsx`: 108 files across `actions/`, `models/`, `lib/`, `app/`, `components/`, `providers/`, plus `navigation`/`i18n`/`app/fonts`.
- Edited (config/deps): `package.json`, `package-lock.json`, `components.json`.
- Docs: `docs/migration/{plan.md, README.md, phase3/typescript-migration.md}`, `CLAUDE.md`.

## References

- next-intl navigation: [createSharedPathnamesNavigation](https://next-intl-docs.vercel.app/docs/routing/navigation) · [EdgeStore Next.js](https://edgestore.dev/docs/quick-start) · [date-fns v3 migration](https://date-fns.org/v3.0.0/docs/Change-Log)
