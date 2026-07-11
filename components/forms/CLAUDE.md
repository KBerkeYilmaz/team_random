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
- **Schema source is split:** member/work forms import shared schemas from
  `actions/schemas.ts` (`z.infer`); the remaining user/contact/login forms use **local
  inline** schemas. Before changing validation, check which regime the form is in.
  - `EditUserPasswordForm` was moved into the shared regime: it now imports
    `updatePasswordSchema` from `actions/schemas.ts` (issue #126), closing the old
    client `min(3)` vs server `min(8)` drift. All three password fields require `min(8)`.
- The client `role !== "admin"` bail-out is a **UX hint only** — the action's
  `requireAdmin()` is the real boundary.
- `ContactForm`'s `if (result.error)` branch is effectively dead (`sendMail` never
  returns `{ error }`), so a failed send still shows a non-destructive toast.
