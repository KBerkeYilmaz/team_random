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

## Validation — one shared regime (as of Phase 4b / #153)
Every Zod schema lives in `actions/schemas.ts` and is **shared** with the forms via
`z.infer` — `memberSchema` / `updateMemberSchema` / `workSchema`, `updatePasswordSchema`
(`updateUserPassword` ⇄ `EditUserPasswordForm`, #126), and `editUserSchema`
(`updateUser` ⇄ `EditUserForm`, extracted in 4b), plus `contactSchema` / `loginSchema`
for the two non-action forms (`ContactForm`, `LoginForm`). Edit a schema once and both
the action's `safeParse` and the form's `zodResolver` follow — no action or form carries
an inline schema anymore. (This replaced the earlier split regime, where `userActions.ts`
defined its schemas inline per function and the user/contact/login forms held local copies.)

## Data access & logging
Reads go through the Mongoose models in `models/` via `connectDB()`
(`lib/database.ts`), using `.lean()`/`.select()`. Catch blocks log one
`console.error("<fn> failed:", e)` — no debug `console.log`, and there is no logger
abstraction (deliberately deferred). A later phase moves domain data to
Prisma/Postgres (the data-layer migration tracked in epic #81); until then it is Mongoose.
