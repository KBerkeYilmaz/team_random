"use server";

import { revalidatePath } from "next/cache";
import Work from "@/models/work";
import connectDB from "@/lib/database";
import { requireAdmin } from "@/lib/authGuard";
import { z } from "zod";


// AUDIT #83 (issue #82): every MUTATING action below (create/update/delete) is
// gated by requireAdmin(), which derives the admin role from the server session.
// Previously each took a `role` argument FROM THE CLIENT and checked
// `if (role !== "admin")`, so a forged request passing role:"admin" bypassed
// authorization. Read-only getters are intentionally left ungated.
export async function getWorks({ skip = 0, limit = 0 } = {}) {
  try {
    await connectDB();
    // .select() preserves the exact field set the table used before (it omits
    // workContributors, workImages and timestamps); .lean() makes them plain
    // RSC-safe objects. limit(0) = no limit, so no-arg callers are unchanged.
    const docs = await Work.find()
      .select("workTitle workGithubURL workAppURL workReadme workTechStack")
      .skip(skip)
      .limit(limit)
      .lean();
    return docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
  } catch (error) {
    console.error("getWorks failed:", error);
    return { error: "Something went wrong" };
  }
}
export async function getWorkCount() {
  try {
    await connectDB();
    const result = await Work.countDocuments()
    return result
  } catch (error) {
    console.error("getWorkCount failed:", error);
    return { error: "Something went wrong" }
  }
}
export async function getWork(id) {
  try {
    await connectDB();
    const doc = await Work.findById(id).lean();
    if (!doc) return null;
    // Restore the string `id` (previously the Mongoose `id` virtual on the raw
    // doc this used to return) and default workImages to [] so WorkDetails'
    // `work.workImages.length` never hits undefined — .lean() omits empty arrays.
    const { _id, __v, ...rest } = doc;
    return { id: _id.toString(), ...rest, workImages: doc.workImages ?? [] };
  } catch (error) {
    console.error("getWork failed:", error);
    return { error: "Something went wrong" };
  }
}
export async function createWork(formData) {
  const workSchema = z.object({
    workTitle: z.string().min(2, "Title must be at least 2 characters."),
    workGithubURL: z.string().url().optional().or(z.literal("")),
    workAppURL: z.string().url().optional().or(z.literal("")),
    workReadme: z.string().min(2, "Readme must be at least 2 characters."),
    workTechStack: z
      .string()
      .min(2, "Tech Stack must be at least 2 characters."),
    workContributors: z.string().optional(), // Assuming contributors is an array of strings
    // workImages: z.array().url().optional().or(z.literal("")),
    workImages: z.array(z.string().url()).optional(),
  });

  const validatedFields = workSchema.safeParse({
    workTitle: formData.workTitle,
    workGithubURL: formData.workGithubURL,
    workAppURL: formData.workAppURL,
    workReadme: formData.workReadme,
    workTechStack: formData.workTechStack,
    workContributors: formData.workContributors,
    workImages: formData.workImages,
  });
  //   const validatedFields = workSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  try {
    await requireAdmin();
    await connectDB();
    const work = await Work.create(validatedFields.data);
    revalidatePath("/dashboard/works");
    return {
      message: `Work "${validatedFields.data.workTitle}" created!`,
    }; // Return the created work object
  } catch (error) {
    console.error("Failed to create work:", error);
    // Handle database errors, e.g., connection issues or constraints violations
    return {
      error: `Failed to create the work due to ${error.message}`,
    };
  }
}
export async function updateWork(formData, id) {
  const workSchema = z.object({
    workTitle: z.string().min(2, "Title must be at least 2 characters."),
    workGithubURL: z.string().url().optional().or(z.literal("")),
    workAppURL: z.string().url().optional().or(z.literal("")),
    workReadme: z.string().min(2, "Readme must be at least 2 characters."),
    workTechStack: z.string().min(2, "Tech Stack must be at least 2 characters."),
    workContributors: z.string().optional(), // Assuming contributors is an array of strings
    // workImages: z.array().url().optional().or(z.literal("")),
    workImages: z.array(z.string().url()).optional(),
  });

  const validatedFields = workSchema.safeParse({
    workTitle: formData.workTitle,
    workGithubURL: formData.workGithubURL,
    workAppURL: formData.workAppURL,
    workReadme: formData.workReadme,
    workTechStack: formData.workTechStack,
    workContributors: formData.workContributors,
    workImages: formData.workImages,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const updatedWork = {
    workTitle: formData.workTitle,
    workGithubURL: formData.workGithubURL,
    workAppURL: formData.workAppURL,
    workReadme: formData.workReadme,
    workImages: formData.workImages,
    workTechStack: formData.workTechStack,
    workContributors: formData.workContributors,
  }
  try {
    await requireAdmin();
    await connectDB();
    await Work.findByIdAndUpdate(id, updatedWork, { new: true });
    revalidatePath("/dashboard/works");
    return {
      message: `Work updated successfully!`,
    }; // Return the updated work object
  } catch (error) {
    console.error("Failed to update work:", error);
    // Handle database errors, e.g., connection issues or constraints violations
    return {
      error: `Failed to update the work due to ${error.message}`,
    };
  }
}
export async function deleteWork(id) {
  try {
    await requireAdmin();
    await connectDB();
    await Work.findByIdAndDelete(id)
    revalidatePath("/dashboard/works");
    return { message: "Work deleted Successfully" }
  } catch (error) {
    console.error("deleteWork failed:", error);
    return { error: "Something went wrong" }
  }
}
