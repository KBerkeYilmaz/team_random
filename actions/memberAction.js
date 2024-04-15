"use server";
import { revalidatePath } from "next/cache";
import Member from "@/models/member";
import connectDB from "@/lib/database";
import { z } from "zod";

export async function createMember(formData) {
  const newMemberSchema = z.object({
    memberName: z.string().min(3, "Member name must be at least 3 characters."),
    memberLastName: z.string().min(3, "Last name must be at least 3 characters."),
    memberTitle: z.string().min(3, "Title must be at least 3 characters."),
    memberBio: z.string().optional(), // Optional field
    memberPersonal: z.string().url().optional().or(z.literal("")), // Optional URL
    memberGithub: z.string().url().optional().or(z.literal("")), // Optional URL
    memberLinkedin: z.string().url().optional().or(z.literal("")), // Optional URL
    memberImage: z.string().url().optional().or(z.literal("")), // Optional URL
  });

  const validatedFields = newMemberSchema.safeParse({
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
    console.log(validatedFields.error);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
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
      error: `Failed to create the member due to ${error.message}`,
    };
  }
}

export async function updateMember(formData, id) {
  const newMemberSchema = z.object({
    memberName: z.string().min(3, "Member name must be at least 3 characters."),
    memberLastName: z.string().min(3, "Last name must be at least 3 characters."),
    memberTitle: z.string().min(3, "Title must be at least 3 characters."),
    memberBio: z.string().optional(), // Optional field
    memberPersonal: z.string().url().optional().or(z.literal("")), // Optional URL
    memberGithub: z.string().url().optional().or(z.literal("")), // Optional URL
    memberLinkedin: z.string().url().optional().or(z.literal("")), // Optional URL
    // memberImage: z.string().url().optional().or(z.literal("")), // Optional URL
  });

  const validatedFields = newMemberSchema.safeParse({
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
    console.log(validatedFields.error);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  try {
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
    const result = await Member.findByIdAndUpdate(id, updatedMember, { new: true })
    console.log(result);
    revalidatePath("/");
    return {}

  } catch (error) {
    console.error("Failed to update member:", error);
    // Handle database errors, e.g., connection issues or constraints violations
    return {
      error: `Failed to update the member due to ${error.message}`,
    };
  }
}

export const updateMemberImage = async (imgUrl, id) => {
  try {
    await connectDB();
    const result = await Member.findByIdAndUpdate(id, { memberImage: imgUrl }, { new: true })

    console.log(result);
    revalidatePath("/dashboard/members");
    return {}
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" }
  }

}

export async function getMembers() {
  try {
    await connectDB();
    const result = await Member.find()
    return result
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" }
  }
}

export async function getMember(id) {
  try {
    await connectDB();
    const result = await Member.findById(id)

    return result

  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" }
  }
}

export async function deleteMember(id) {
  try {
    await connectDB();
    const result = await Member.findByIdAndDelete(id)
    console.log(result);
    revalidatePath("/dashboard/members");
    return { message: "Member deleted Successfully" }
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" }
  }
}