# app/ — Next.js App Router (routes, layouts)

Read before adding a route or layout. Route handlers have their own doc:
`app/api/CLAUDE.md`.

## Layout
- Every page lives under `app/[locale]/` (locales `en` / `tr`). The `[locale]/layout.tsx`
  wraps the public site: next-intl + theme + EdgeStore providers, Navbar/Footer/Toaster.
- The **`(dashboard)` route group** is the admin area — `members/`, `works/`, `inbox/`,
  `account/`, most with an `[id]/` detail route, a `columns.tsx`, and a `loading.tsx`.

## The admin gate — one chokepoint
Dashboard authorization is enforced **server-side in the `(dashboard)` group's
`layout.tsx`** and nowhere else for pages:

```
const session = await auth.api.getSession({ headers: await headers() });
if (!session || session.user?.role !== "admin") redirect("/login");
```

- `redirect` comes from `@/navigation` (locale-aware next-intl), **not** `next/navigation`.
- `middleware.ts` is only an **optimistic** session-cookie presence check — explicitly
  *not* a trust boundary. Don't move real authorization into it.
- This layout re-implements the check inline rather than calling `requireAdmin()`
  (which is action-scoped). If you change the role model, update **both** places.

## Conventions
- Keep pages and layouts as **server** components; push `"use client"` down to leaves.
- Pages consume `actions/` and guard their error unions: `if (!res || "error" in res)`
  or `notFound()`.
