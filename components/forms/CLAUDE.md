# components/forms/ — the form components

Read before adding or editing a form. All of these are `"use client"`.

## Uniform convention
`react-hook-form` `useForm<z.infer<Schema>>()` + `@hookform/resolvers/zod` `zodResolver`,
rendered with the shadcn `<Form>` / `<FormField>` primitives, `useToast()` for feedback,
and a `Loader2` spinner while submitting.

## Wiring
- **Server-action forms** `await` the action in `onSubmit` and branch on `result.error` /
  `result.message`: `NewMemberForm`, `EditMemberForm`, `NewWorkForm`, `EditWorkForm`,
  `EditUserForm`, `EditUserPasswordForm`.
- **Non-action forms:** `ContactForm` → `sendEmail` (a `fetch` wrapper, not an action);
  `LoginForm` → `signIn.email` (Better Auth).
- Image uploads go through `useEdgeStore()` **before** the action is called.

## Gotchas
- **Schema source is unified (as of Phase 4b / #153):** every form's Zod schema lives in
  `actions/schemas.ts` and is shared with its action/consumer via `z.infer` — member/work,
  `updatePasswordSchema` (`EditUserPasswordForm`), and now contact/login/editUser
  (`ContactForm`/`LoginForm`/`EditUserForm`). No form carries an inline `z.object` anymore: edit
  the schema once and both the form (`zodResolver`) and the action (`safeParse`) follow.
  - `updatePasswordSchema` closed the old client `min(3)` vs server `min(8)` drift (#126) — all
    three password fields require `min(8)`. `editUserSchema` likewise single-sourced the
    EditUser/updateUser pair; its name-too-short message is the canonical "User name…" (was a
    copy-pasted "Member name…").
- The client `role !== "admin"` bail-out is a **UX hint only** — the action's
  `requireAdmin()` is the real boundary.
- `ContactForm`'s `if (result.error)` branch is effectively dead (`sendMail` never
  returns `{ error }`), so a failed send still shows a non-destructive toast.
