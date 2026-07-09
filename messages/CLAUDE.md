# messages/ — next-intl translation catalogs

Read before touching i18n copy.

## Current state
- `en.json` and `tr.json`, locales `en` / `tr` only. **Both hold ~2 keys**
  (`Index.title`, `LangSwitch.title`) — next-intl is wired up but **barely used**;
  ~95% of UI copy is still **hardcoded English** in the components (form labels,
  dashboard headings, home-page sections, button and toast text).
- Completing i18n — extracting the hardcoded strings and localizing the Zod messages via
  schema factories — is a dedicated later phase (see `docs/migration/plan.md`). Until
  then, don't assume a key exists.

## Convention (when you add copy)
- Namespaced keys (`Namespace.key`), read via `useTranslations` / `getTranslations`.
  Don't hardcode new user-facing strings.
- **Add every new key to both `en.json` and `tr.json` in the same change** — keep the two
  catalogs in lockstep so a missing-key runtime error can't ship.
