"use server"
import connectDB from "@/lib/database"
import User from "@/models/user"
import { z } from "zod";

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
        await connectDB();
        const result = await User.findByIdAndUpdate(id, { fullName: formData.name, userMail: formData.email }, { new: true })

        console.log(result);
        return {}

    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }
}
export const updateUserImage = async (imgUrl, id) => {
    //Todo - Validations

    try {
        await connectDB();
        const result = await User.findByIdAndUpdate(id, { img: imgUrl }, { new: true })

        console.log(result);
        return {}
    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }

}