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

import type { Types } from "mongoose";
import type { IMember } from "@/models/member";
import type { IWork } from "@/models/work";

// A Mongoose `.lean()` document carries `_id` and `__v` at runtime, but the
// default lean typings omit `__v` — so the getters that destructure it out
// (`{ _id, __v, ...rest }`) need this to model the real shape. Type-only import
// of `Types`, so no Mongoose value crosses into any client bundle.
export type Lean<T> = T & { _id: Types.ObjectId; __v: number };

// ---------------------------------------------------------------------------
// Getter row shapes — the plain, RSC-safe objects the read actions return (a
// string `id` instead of the Mongoose ObjectId). These mirror what each getter
// actually produces at runtime, so consuming pages can guard on the honest
// union `Row | { error: string } | null` (see docs/migration/phase3).
// The model interfaces are imported *as types only* (erased at build), so
// bringing these into a client component never pulls Mongoose into that bundle.
// ---------------------------------------------------------------------------

// getMembers / getMember: the full member document (no `.select()`), with a
// string id in place of `_id` (`__v` is dropped).
export type MemberRow = { id: string } & IMember;

// getWorks: only the `.select()`-ed scalar columns the dashboard table renders,
// plus the string id — deliberately narrower than the full IWork.
export type WorkListItem = {
  id: string;
  workTitle: string;
  workGithubURL?: string;
  workAppURL?: string;
  workReadme: string;
  workTechStack: string;
};

// getWork: the full record, with a string id and `workImages` guaranteed to be
// an array ([] default) — WorkDetails reads `workImages.length` unconditionally.
export type WorkDetail = { id: string } & Omit<IWork, "workImages"> & {
    workImages: string[];
  };

// What the work detail page hands to WorkDetails / EditWorkForm: the full work
// minus the RSC timestamps. `works/[id]/page` builds exactly this subset (and it
// omits workContributors, which is optional here — that's why the edit form's
// Contributors field starts empty, matching the pre-Phase-3 behaviour).
export type WorkFormData = Omit<WorkDetail, "createdAt" | "updatedAt">;

// One email as surfaced by fetchInbox (shaped by /api/email GET, then serialized
// over fetch so Dates arrive as strings). Fields are optional because the inbox
// UI reads them defensively.
export type InboxEmail = {
  uid: number;
  from?: string;
  subject?: string;
  text?: string;
  date?: string;
  unseen?: boolean;
};
