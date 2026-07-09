// Phase 3 (TypeScript migration): shared return-shape for the server actions.
//
// This is a deliberately PERMISSIVE state object, not a discriminated union — it
// mirrors what the code actually does today. Every mutating action returns some
// subset of { message, error, errors }, and the forms read those fields by a
// plain truthy check (`if (result.error)`, `result.message`), never via a
// discriminant like `"error" in result`. No action returns a `{ data }` payload.
//
// NOTE (deviation from docs/migration/plan.md): plan.md sketched a
// `ActionResult<T> = { data:T } | { error } | { errors }` discriminated union.
// That shape does not match the current forms (no `data`, truthy-checked fields),
// so adopting it would force form-logic changes inside a type-only phase. The
// faithful, behaviour-preserving type is this permissive `ActionState`; the
// discriminated-union refactor is deferred to Phase 5/6 when the forms are
// reworked. See docs/migration/phase3/typescript-migration.md.

// Zod's `flatten().fieldErrors` shape: a per-field array of messages (or
// undefined when that field had no error).
export type ActionFieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  message?: string; // success toast text
  error?: string; // thrown / DB failure surfaced to the user
  errors?: ActionFieldErrors; // zod validation failure (flatten().fieldErrors)
};
