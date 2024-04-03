"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/navigation";
import { Button } from "../ui/button";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Use Next-Auth's signIn function instead of fetch
    const result = await signIn("credentials", {
      redirect: false, // Prevent Next-Auth from redirecting automatically
      email,
      password,
    });

    if (result?.error) {
      // Handle errors (e.g., display a message to the user)
      console.log(result.error || "Login failed!"); // Display error toast
    } else {
      console.log("Login successful");
      setTimeout(() => {
        router.push(`/dashboard`); // Redirect to the user page
      }, 500); // Wait for 1 second before redirecting
    }
  };

  return (
    <form
      className="sign-in-form lg:px-[8.15rem]  w-screen flex justify-center items-center max-w-[1024px]"
      id="sign-in-form"
      onSubmit={handleSubmit}
    >
      <div className="py-[15%] px-[1.87rem] flex flex-col gap-[8px] w-full">
        <h3 className="pb-[0.9rem] font-bold text-[35px] text-left">Sign In</h3>

        <div className="grid grid-rows-2 grid-cols-1 gap-[0.6rem]">
          <div className="w-full">
            <label htmlFor="user-email">E-Mail</label>
            <input
              id="user-email"
              type="email"
              onChange={handleEmailChange}
              name="email"
              className="w-full rounded-md bg-input border h-[40px] p-[0.75rem]"
            />
          </div>
          <div>
            <label htmlFor="user-password">Password</label>
            <input
              id="user-password"
              type="password"
              name="password"
              className="w-full rounded-md bg-input border h-[40px] p-[0.75rem]"
              onChange={handlePasswordChange}
            />
          </div>
        </div>
        <Button id="form-submit-btn" type="submit">
          Login
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
