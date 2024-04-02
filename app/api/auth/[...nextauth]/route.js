import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/user";
import connectDB from "@/lib/database";
import bcrypt from "bcrypt";

async function auth(req, res) {
  // Do whatever you want here, before the request is passed down to `NextAuth`
  console.log("Request:", req.method, req.url, req.body);

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
          console.log("This is the cred email" + email);
          const password = credentials.password;
          console.log("This is the cred pass " + password);
          console.log(email, password);
          // Your existing login logic here, adapted from the original function
          await connectDB();
          const user = await User.findOne({ userMail: email }).exec(); // Assuming your user schema has an 'email' field
          if (!user) {
            console.log("User not found with email:", email);
            throw new Error("No user found with the given email");
          }
          // User found, now compare the submitted password with the hashed password stored
          const isMatch = await bcrypt.compare(password, user.userPassword); // Assuming your user schema has a 'password' field for the hashed password
          if (!isMatch) {
            // If the password doesn't match
            console.log("Password does not match for user:", email);
            throw new Error("Password does not match");
          }
          console.log("User authenticated:", user);

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
    },
    callbacks: {
      async jwt({ token, user }) {
        console.log("JWT callback - user:", user);
        if (user) {
          token.id = user.id; // Correctly access the nested 'id'
          token.email = user.userMail; // Example of adding more user details to the token
        }
        console.log("JWT callback - token:", token);
        return token;
      },
      async session({ session, token }) {
        session.expires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // Set session expiry to 30 minutes
        // Use the token to set custom session values or modify the session object
        session.user.id = token.id;
        session.user.email = token.email; // Add email to session
        return session;
      },
    },
  });
}

export { auth as GET, auth as POST };
