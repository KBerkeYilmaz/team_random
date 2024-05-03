"use server";

import { revalidatePath } from "next/cache";
import Work from "@/models/work";
import connectDB from "@/lib/database";
import { z } from "zod";


export async function getWorks() {
  try {
    await connectDB();
    const rawResult = await Work.find();
    const result = rawResult.map(item => ({
      id: item._id.toString(),
      workTitle: item.workTitle,
      workGithubURL: item.workGithubURL,
      workAppURL: item.workAppURL,
      workReadme: item.workReadme,
      workTechStack: item.workTechStack,
      // Uncomment other fields as necessary
      // workContributors: item.workContributors,
      // workImages: item.workImages,
    }));
    return result;
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" };
  }
}
export async function getWorkCount() {
  try {
    await connectDB();
    const result = await Work.countDocuments()
    return result
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" }
  }
}
export async function getWork(id) {
  try {
    await connectDB();
    const result = await Work.findById(id);
    return result;
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" };
  }
}
export async function createWork(formData, role) {
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
    console.log(validatedFields.error);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  try {
    if (role !== "admin") {
      throw new Error
    }
    await connectDB();
    const work = await Work.create(validatedFields.data);
    revalidatePath("/dashboard/works");
    return {
      message: `Work "${validatedFields.data.workTitle}" created!`,
    }; // Return the created member object
  } catch (error) {
    console.error("Failed to create work:", error);
    // Handle database errors, e.g., connection issues or constraints violations
    return {
      error: `Failed to create the member due to ${error.message}`,
    };
  }
}
export async function UpdateWork(formData, id, role) {
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
    console.log(validatedFields.error);
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
    if (role !== "admin") {
      throw new Error
    }
    await connectDB();
    const result = await Work.findByIdAndUpdate(id, updatedWork, { new: true });
    revalidatePath("/dashboard/works");
    return {
      message: `Work updated successfully!`,
    }; // Return the created member object
  } catch (error) {
    console.error("Failed to create work:", error);
    // Handle database errors, e.g., connection issues or constraints violations
    return {
      error: `Failed to create the member due to ${error.message}`,
    };
  }
}
export async function deleteWork(id, role) {
  try {
    if (role !== "admin") {
      throw new Error
    }
    await connectDB();
    const result = await Work.findByIdAndDelete(id)
    revalidatePath("/dashboard/works");
    return { message: "Work deleted Successfully" }
  } catch (error) {
    console.log(error);
    return { error: "Something went wrong" }
  }
}