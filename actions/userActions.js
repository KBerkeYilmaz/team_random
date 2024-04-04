"use server"
import connectDB from "@/lib/database"
import User from "@/models/user"
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const updateUserName = async (formdata, email) => {

    try {
        await connectDB();
        // const resul = await User.find({ userMail: "sadikbarisyilmaz@teamrandom.com" }, { new: true })
        // console.log("resul:", resul[0].id);
        // const result = await User.findByIdAndUpdate("660ea91e68dc730b3f60642b", { fullName: formdata }, { new: true })
        // console.log(result);
        // return {}
        const result = await User.findOneAndUpdate({ userMail: email }, { fullName: formdata }, { new: true })
        console.log(result);
        return {}
    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }

}