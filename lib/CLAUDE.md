# lib/ — app singletons & shared utilities

Read before adding or editing anything here. These modules are imported across
`app/`, `actions/`, and `components/`.

## Env discipline (hard rule)
`lib/env.ts` is the **single source of truth** for configuration: Zod-validated
`process.env`, parsed once, fail-fast at import. **Import `env` from `lib/env.ts` —
never read `process.env` directly** in app code. (The only sanctioned direct reader is
the standalone migration script under `scripts/migrations/`, which runs outside the app
runtime.)

## What's here
- `auth.ts` — Better Auth **server** instance: its own native `MongoClient` pool
  (separate from Mongoose), `mongodbAdapter`, custom bcrypt hash/verify that preserves
  the legacy hashes, `admin()` plugin, `nextCookies()` **last**. Source of truth for the
  `user`/`account` collections.
- `auth-client.ts` — Better Auth **browser** client: `authClient`, `useSession`,
  `signIn`, `signOut` (with `adminClient()`). Client session consumers import from here,
  not from `next-auth`.
- `authGuard.ts` — **`requireAdmin()`**, the server-side authz boundary for actions
  (`getSession` + `role === "admin"` or throw).
- `database.ts` — **`connectDB()`**, the global-cached Mongoose connection *promise*
  (serverless-safe; it replaced the old per-call `mongoose.connect()` + `process.exit`).
- `edgestore.ts` — `"use client"` EdgeStore provider/hook (`EdgeStoreProvider`,
  `useEdgeStore`).
- `sendMail.ts` — `sendEmail()`, a plain `fetch` wrapper POSTing to the contact API.
  **Not** a server action. It **honours `response.ok`** (issue #127): a failed send returns
  `{ error, message }` (a 503 → an `"email-not-configured"` hint; other non-ok responses /
  a network throw → a generic `"send-failed"`), while success returns `{ message }`. So a
  caller's `.error` branch is **live** — `ContactForm` shows a destructive toast on failure.
- `utils.ts` — `cn()` (clsx + tailwind-merge), the shadcn helper.

There is no logger module — logging is bare `console.error`. Better Auth and Mongoose
open **separate pools against the same DB**; consolidation was deliberately deferred and
a later phase moves everything to Prisma/Postgres (the data-layer migration tracked in epic #81).
