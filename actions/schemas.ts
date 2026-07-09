// Phase 3 (TypeScript migration): the single source of truth for member/work
// form + action validation. These Zod schemas were previously duplicated inline
// in both the server action (safeParse) and the client form (zodResolver). They
// are now shared, and the inferred input types (`z.infer`) type the actions'
// parameters and the forms' `useForm<...>` generic.
//
// Fields are copied VERBATIM from the pre-Phase-3 inline schemas (including the
// exact validation messages) so runtime validation behaviour is unchanged. Where
// the create and update variants differed, that difference is preserved below.
import { z } from "zod";

// createMember validates all fields incl. the (optional) memberImage URL.
export const memberSchema = z.object({
  memberName: z.string().min(3, "Member name must be at least 3 characters."),
  memberLastName: z
    .string()
    .min(3, "Last name must be at least 3 characters."),
  memberTitle: z.string().min(3, "Title must be at least 3 characters."),
  memberBio: z.string().optional(),
  memberPersonal: z.string().url().optional().or(z.literal("")),
  memberGithub: z.string().url().optional().or(z.literal("")),
  memberLinkedin: z.string().url().optional().or(z.literal("")),
  memberImage: z.string().url().optional().or(z.literal("")),
});
export type MemberInput = z.infer<typeof memberSchema>;

// updateMember never validates the image (it is edited separately via
// updateMemberImage), matching the pre-Phase-3 schema where memberImage was
// commented out. `.omit` keeps this in lockstep with memberSchema.
export const updateMemberSchema = memberSchema.omit({ memberImage: true });
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

// create/update work share one schema (they were byte-identical before).
export const workSchema = z.object({
  workTitle: z.string().min(2, "Title must be at least 2 characters."),
  workGithubURL: z.string().url().optional().or(z.literal("")),
  workAppURL: z.string().url().optional().or(z.literal("")),
  workReadme: z.string().min(2, "Readme must be at least 2 characters."),
  workTechStack: z.string().min(2, "Tech Stack must be at least 2 characters."),
  workContributors: z.string().optional(),
  workImages: z.array(z.string().url()).optional(),
});
export type WorkInput = z.infer<typeof workSchema>;
