"use server"
import connectDB from "@/lib/database"
import User from "@/models/user"

export const updateUserName = async (formdata, email) => {
    try {
        await connectDB();
        const result = await User.findOneAndUpdate({ userMail: email }, { fullName: formdata }, { new: true })

        console.log(result);
        return {}

    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }
}

export const updateUserImage = async (imgUrl, email) => {

    try {
        await connectDB();
        const result = await User.findOneAndUpdate({ userMail: email }, { img: imgUrl }, { new: true })

        console.log(result);
        return {}
    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }

}