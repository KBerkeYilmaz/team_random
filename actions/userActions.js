"use server"
import connectDB from "@/lib/database"
import User from "@/models/user"

export const updateUserName = async (formdata, id) => {
    try {
        await connectDB();
        const result = await User.findByIdAndUpdate(id, { fullName: formdata }, { new: true })

        console.log(result);
        return {}

    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }
}

export const updateUserImage = async (imgUrl, id) => {

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