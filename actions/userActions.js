"use server"
import connectDB from "@/lib/database"
import User from "@/models/user"
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const updateUserName = async (formdata) => {

    try {
        await connectDB();
        const result = await User.findByIdAndUpdate("660ea91e68dc730b3f60642b", { fullName: formdata }, { new: true })
        console.log(result);
        return {}

    } catch (error) {
        console.log(error);
        return { error: "Something went wrong" }
    }

}