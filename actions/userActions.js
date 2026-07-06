"use server"
import connectDB from "@/lib/database"
import User from "@/models/user"
import { requireAdmin } from "@/lib/authGuard";
import { z } from "zod";
import bcrypt from "bcrypt";

// AUDIT #83 (issue #82): every action below is gated by requireAdmin(), which
// derives the admin role from the server session. Previously each took a `role`
// argument FROM THE CLIENT and checked `if (role !== "admin")`, so a forged
// request passing role:"admin" bypassed authorization entirely.
export const updateUser = async (formData, id) => {


    const userSchema = z.object({
        fullName: z.string().min(3, "User name must be at least 3 characters."),
        userMail: z.string().email("Please enter a valid email."),
    });

    const validatedFields = userSchema.safeParse({
        fullName: formData.name,
        userMail: formData.email,
    });

    // Return early if the form data is invalid
    if (!validatedFields.success) {
        console.log(validatedFields.error);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    try {
        await requireAdmin();

        await connectDB();
        const result = await User.findByIdAndUpdate(id, { fullName: formData.name, userMail: formData.email }, { new: true })

        console.log(result);


        return {}

    } catch (error) {
        console.log(error.message);
        return { error: "Something went wrong" }
    }
}
export const updateUserImage = async (imgUrl, id) => {

    try {
        await requireAdmin();

        await connectDB();
        const result = await User.findByIdAndUpdate(id, { img: imgUrl }, { new: true })

        console.log(result);
        return {}
    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }

}
export const updateUserPassword = async (formData, id) => {
    const userSchema = z.object({
        currentPassword: z.string().min(3),
        newPassword: z.string().min(3),
        passwordConfirmation: z.string().min(3),
    })
        .refine((data) => data.newPassword === data.passwordConfirmation, {
            message: "Passwords don't match",
            path: ["passwordConfirmation"], // path of error
        });

    const validatedFields = userSchema.safeParse({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        passwordConfirmation: formData.passwordConfirmation
    });

    // Return early if the form data is invalid
    if (!validatedFields.success) {
        console.log(validatedFields.error);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    try {
        await requireAdmin();
        await connectDB();
        const user = await User.findById(id)
        const isMatch = await bcrypt.compare(formData.currentPassword, user.userPassword);

        if (!isMatch) {
            return { error: "Wrong Password" }
        }

        const hashedNewPassword = await bcrypt.hash(formData.newPassword, 10);
        const result = await User.findByIdAndUpdate(id, { userPassword: hashedNewPassword }, { new: true })

        return {}

    } catch (error) {
        return { error: "Something went wrong" }
    }
}
