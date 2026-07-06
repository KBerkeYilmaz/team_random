// lib/authOptions.js
// Extracted from app/api/auth/[...nextauth]/route.js so the same options can be
// shared with getServerSession(). Throwaway — removed when Better Auth lands (Phase 1).
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/user";
import connectDB from "@/lib/database";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        await connectDB();
        const user = await User.findOne({ userMail: credentials.email }).exec();
        if (!user) {
          throw new Error("No user found with the given email");
        }
        const isMatch = await bcrypt.compare(
          credentials.password,
          user.userPassword,
        );
        if (!isMatch) {
          throw new Error("Password does not match");
        }
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
    updateAge: 60 * 60, // 1 hour
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id.toString();
        token.email = user.userMail;
        token.name = user.fullName;
        token.image = user.img;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.image;
      session.user.role = token.role;
      return session;
    },
  },
};
