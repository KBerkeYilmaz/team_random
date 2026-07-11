# actions/ — server actions (`"use server"`)

Read before adding or editing an action. The root `CLAUDE.md` has the project-wide
auth model; this is the actions-local contract.

## Security invariant (non-negotiable)
Every **mutating** action calls `await requireAdmin()` (`lib/authGuard.ts`) —
authorization is derived from the server session, **never** from a client-supplied
`role`. Do not add a `role` parameter back to any signature; that was the
pre-modernization privilege-escalation vuln (AUDIT #83). Getters (`getMembers`,
`getWork`, the counts, …) are intentionally **ungated** — they render on public pages.

- `requireAdmin()` runs *inside* `try`, and for `create*`/`update*` *after* `safeParse`.
  Consequence by design: an invalid **and** unauthorized create returns Zod field
  `errors`, not a 401 — validation is reported first.

## Return shape — `ActionState`
Mutations return the deliberately **permissive** `ActionState` from `actions/types.ts`
(`{ message?, error?, errors? }`) — *not* a discriminated union. Forms read it by
truthy check (`if (result.error)` / `result.message`), never `"error" in result`.
Match this; don't invent a per-action shape.

- Getters return honest unions instead — e.g. `MemberRow[] | { error }`,
  `WorkDetail | { error } | null`; pages guard with `if (!res || "error" in res)`
  or `notFound()`.
- Success shape is **inconsistent** across mutations: some return `{}`, others
  `{ message }`, and forms compensate with hardcoded toast text. If you touch one,
  prefer returning a `message`.

## Validation — two regimes (don't over-generalize)
- `memberSchema` / `updateMemberSchema` / `workSchema` live in `actions/schemas.ts`
  and are **shared** with the forms via `z.infer` — edit the schema once, both sides
  follow.
- **Partial exception:** `updateUserPassword` now shares `updatePasswordSchema` from
  `actions/schemas.ts` with `EditUserPasswordForm` (issue #126 — this closed the old
  client `min(3)` vs server `min(8)` drift). The rest of `userActions.ts` still defines
  its Zod schemas **inline per function**, and the user/contact/login forms carry their
  own local schemas — so most user-account validation is still duplicated. Do not assume
  "all forms share schemas."

## Data access & logging
Reads go through the Mongoose models in `models/` via `connectDB()`
(`lib/database.ts`), using `.lean()`/`.select()`. Catch blocks log one
`console.error("<fn> failed:", e)` — no debug `console.log`, and there is no logger
abstraction (deliberately deferred). A later phase moves domain data to
Prisma/Postgres (the data-layer migration tracked in epic #81); until then it is Mongoose.
