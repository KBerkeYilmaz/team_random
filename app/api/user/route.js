import connectDB from "@/lib/database"; // Adjust the path as necessary
import User from "@/models/user"; // Adjust the path as necessary
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// AUDIT #83 (issue #82): this route was previously unauthenticated and exported
// as BOTH POST and GET, so anyone could create users. The GET export has been
// removed; only an authenticated admin may POST here.
export async function POST(req) {
  // Only an authenticated admin may create users. There is no public signup UI.
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  try {
    const body = await req.json();
    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);
    // Create a new user with the hashed password. Role is never taken from the
    // request body — new users are always created as "user".
    // AUDIT #83: was `role: res.role` (trusted the request body) → privilege escalation.
    const user = await User.create({
      userMail: body.email,
      userPassword: hashedPassword,
      fullName: body.fullName,
      img: body.img,
      role: "user",
    });
    // Respond with the created user, explicitly omitting the password hash.
    // AUDIT #83: the omit destructured `password` (a field that does not exist)
    // instead of `userPassword`, so the bcrypt hash leaked in the response.
    const { userPassword, ...userWithoutPassword } = user.toObject();
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "User creation failed" }, { status: 400 });
  }
}
