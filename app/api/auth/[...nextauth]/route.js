import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/user";
import connectDB from "@/lib/database";
import bcrypt from "bcrypt";


const secret = process.env.NEXTAUTH_SECRET;

async function auth(req, res) {

  // Do whatever you want here, before the request is passed down to `NextAuth`
  return await NextAuth(req, res, {
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials) => {
          const email = credentials.email;
          const password = credentials.password;

          // Your existing login logic here, adapted from the original function
          await connectDB();
          const user = await User.findOne({ userMail: email }).exec(); // Assuming your user schema has an 'email' field
          console.log(user);
          if (!user) {
            throw new Error("No user found with the given email");
          }
          // User found, now compare the submitted password with the hashed password stored
          const isMatch = await bcrypt.compare(password, user.userPassword); // Assuming your user schema has a 'password' field for the hashed password
          if (!isMatch) {
            // If the password doesn't match
            throw new Error("Password does not match");
          }
          // If no error and we have user data, return it
          if (user) {
            return user; // The user object will be encoded in the JWT
          } else {
            return null;
          }
        },
      }),
    ],
    session: {
      strategy: "jwt",
      secret: secret,
      maxAge: 60 * 60, // 1 hour
      updateAge: 60 * 60, // 1 hour

    },
    callbacks: {
      async jwt({ token, user }) {
        // if (trigger === "update" && session?.name) {
        if (user) {
          token.id = user._id.toString(); // Correctly access the nested 'id'
          token.email = user.userMail; // Example of adding more user details to the token
          token.name = user.fullName; // Example of adding more user details to the token
          token.image = user.img; // Example of adding more user details to the token
          token.role = user.role; // Example of adding more user details to the token
        }
        return token;
        // }

        if (user) {
          token.id = user._id.toString();; // Correctly access the nested 'id'
          token.email = user.userMail; // Example of adding more user details to the token 
          token.name = user.fullName; // Example of adding more user details to the token
          token.image = user.img; // Example of adding more user details to the token
        }
        return token;
      },
      async session({ session, token, user }) {
        // Use the token to set custom session values or modify the session object
        session.user.id = token.id;
        session.user.email = token.email; // Add email to session
        session.user.name = token.name; // Add name to session
        session.user.image = token.image; // Add image to session
        session.user.role = token.role; // Add image to session
        return session;
      },
    },
  });
}

export { auth as GET, auth as POST };
