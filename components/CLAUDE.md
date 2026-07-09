# components/ — React components

Read before adding a component. The subtrees have their own docs:
`components/ui/CLAUDE.md` (shadcn + bespoke UI) and `components/forms/CLAUDE.md` (forms).

## `"use client"` discipline
Most files here are client components today (hooks, Framer Motion, dropzones, session) —
heavier than ideal. A later phase pushes `"use client"` back down leaf-first. When you
add a component, **default to a server component** and add `"use client"` only if it
genuinely needs hooks / handlers / `useSession` / animation.

## Conventions
- Client role checks (`useSession()` → `data?.user?.role !== "admin"`) are **UX hints
  only, never the security boundary** — the server `requireAdmin()` and the dashboard
  gate are authoritative. Guard optional chains (e.g. `data?.user?.name?.[0]`).
- Detail and table components consume server actions and their error unions; don't fetch
  domain data client-side.
- `Counter.jsx` is dead code slated for removal — don't build on it.
