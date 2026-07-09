"use server";
import { revalidatePath } from "next/cache";
import Member, { type IMember } from "@/models/member";
import connectDB from "@/lib/database";
import { requireAdmin } from "@/lib/authGuard";
import {
  memberSchema,
  updateMemberSchema,
  type MemberInput,
  type UpdateMemberInput,
} from "@/actions/schemas";
import type { ActionState, MemberRow, Lean } from "@/actions/types";

// AUDIT #83 (issue #82): every MUTATING action below (create/update/delete) is
// gated by requireAdmin(), which derives the admin role from the server session.
// Previously each took a `role` argument FROM THE CLIENT and checked
// `if (role !== "admin")`, so a forged request passing role:"admin" bypassed
// authorization. Read-only getters are intentionally left ungated.
//
// Phase 3: getters return an honest union (Row | { error } | null); consuming
// pages guard the DB-failure branch instead of it leaking into a render.
export async function getMembers({
  skip = 0,
  limit = 0,
}: { skip?: number; limit?: number } = {}): Promise<
  MemberRow[] | { error: string }
> {
  try {
    await connectDB();
    // .lean() returns plain objects (not hydrated Mongoose docs) that are safe to
    // pass across the RSC boundary; limit(0) means "no limit", so existing no-arg
    // callers are unchanged. Destructure _id/__v out so the raw ObjectId is never
    // spread into the payload, and emit the string `id` the tables/detail pages use.
    const docs = await Member.find().skip(skip).limit(limit).lean<Lean<IMember>[]>();
    return docs.map(({ _id, __v, ...rest }) => ({ id: _id.toString(), ...rest }));
  } catch (error) {
    console.error("getMembers failed:", error);
    return { error: "Something went wrong" }
  }
}
export async function getMemberCount(): Promise<number | { error: string }> {
  try {
    await connectDB();
    const result = await Member.countDocuments()
    return result
  } catch (error) {
    console.error("getMemberCount failed:", error);
    return { error: "Something went wrong" }
  }
}
export async function getMember(
  id: string,
): Promise<MemberRow | { error: string } | null> {
  try {
    await connectDB();
    const doc = await Member.findById(id).lean<Lean<IMember>>();
    if (!doc) return null; // MemberDetails already renders a loader on null
    const { _id, __v, ...rest } = doc;
    return { id: _id.toString(), ...rest };
  } catch (error) {
    console.error("getMember failed:", error);
    return { error: "Something went wrong" }
  }
}
export async function createMember(formData: MemberInput): Promise<ActionState> {
  const validatedFields = memberSchema.safeParse({
    memberName: formData.memberName,
    memberLastName: formData.memberLastName,
    memberTitle: formData.memberTitle,
    memberBio: formData.memberBio,
    memberPersonal: formData.memberPersonal,
    memberGithub: formData.memberGithub,
    memberLinkedin: formData.memberLinkedin,
    memberImage: formData.memberImage,
  });

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await requireAdmin();
    await connectDB();
    const member = await Member.create(validatedFields.data);
    revalidatePath("/");
    return {
      message: `New member ${validatedFields.data.memberName}, welcome!`,
    }; // Return the created member object
  } catch (error) {
    console.error("Failed to create member:", error);
    // Handle database errors, e.g., connection issues or constraints violations
    return {
      error: `Failed to create the member due to ${(error as Error).message}`,
    };
  }
}
export async function updateMember(
  formData: UpdateMemberInput,
  id: string,
): Promise<ActionState> {
  const validatedFields = updateMemberSchema.safeParse({
    memberName: formData.memberName,
    memberLastName: formData.memberLastName,
    memberTitle: formData.memberTitle,
    memberBio: formData.memberBio,
    memberPersonal: formData.memberPersonal,
    memberGithub: formData.memberGithub,
    memberLinkedin: formData.memberLinkedin,
    // memberImage: formData.memberImage,
  });

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  try {
    await requireAdmin();
    const updatedMember = {
      memberName: formData.memberName,
      memberLastName: formData.memberLastName,
      memberTitle: formData.memberTitle,
      memberBio: formData.memberBio,
      memberPersonal: formData.memberPersonal,
      memberGithub: formData.memberGithub,
      memberLinkedin: formData.memberLinkedin,
    }
    await connectDB();
    await Member.findByIdAndUpdate(id, updatedMember, { new: true })
    revalidatePath("/");
    return {}

  } catch (error) {
    console.error("Failed to update member:", error);
    // Handle database errors, e.g., connection issues or constraints violations
    return {
      error: `Failed to update the member due to ${(error as Error).message}`,
    };
  }
}
export const updateMemberImage = async (
  imgUrl: string,
  id: string,
): Promise<ActionState> => {
  try {
    await requireAdmin();
    await connectDB();
    await Member.findByIdAndUpdate(id, { memberImage: imgUrl }, { new: true })
    revalidatePath("/dashboard/members");
    return {}
  } catch (error) {
    console.error("updateMemberImage failed:", error);
    return { error: "Something went wrong" }
  }

}
export async function deleteMember(id: string): Promise<ActionState> {
  try {
    await requireAdmin();
    await connectDB();
    await Member.findByIdAndDelete(id)
    revalidatePath("/dashboard/members");
    return { message: "Member deleted Successfully" }
  } catch (error) {
    console.error("deleteMember failed:", error);
    return { error: "Something went wrong" }
  }
}
