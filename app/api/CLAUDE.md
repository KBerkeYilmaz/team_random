# app/api/ — route handlers

Read before adding or editing a route handler. Guards here are **inlined** (they don't
use the action-only `requireAdmin()`), so get them right.

## Routes & guards
| Route | Handlers | Guard |
|---|---|---|
| `auth/[...all]` | GET, POST (`toNextJsHandler(auth)`) | Better Auth internal |
| `user` | POST only (GET was deliberately removed) | **Admin** via `auth.api.createUser`; role forced to `"user"` server-side — never from the body |
| `email` | POST (contact form) + GET (inbox) | POST **open by design**; GET **admin-gated** (`getSession` + `role !== "admin"` → 401) |
| `email/count` | GET (unread count) | **Admin-gated** (same 401 pattern) |
| `edgestore/[...edgestore]` | GET, POST (`createEdgeStoreNextHandler`) | **None** — uploads are currently unauthenticated |

## Conventions
- Admin routes inline `auth.api.getSession({ headers })` + a role check → 401. Keep that
  pattern in sync with the dashboard-layout gate and `lib/authGuard.ts` (three copies of
  the same logic).
- The contact-form `POST` on `email` is intentionally public — the only unauthenticated
  mutation. The IMAP inbox/count + SMTP send are currently **inert** (empty `APP_EMAIL` /
  `APP_PASSWORD`) and are slated to move to a persisted DB inbox.
- The `edgestore` handler exports the `EdgeStoreRouter` type consumed by
  `lib/edgestore.ts`. Its lack of an auth guard is a known gap, not a convention to copy.
