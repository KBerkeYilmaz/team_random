"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/navigation";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";

const LoginForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    // Use Next-Auth's signIn function instead of fetch
    const { email, password } = values;
    const result = await signIn("credentials", {
      redirect: false, // Prevent Next-Auth from redirecting automatically
      email,
      password,
    });

    if (result?.error) {
      setIsSubmitting(false);
      // Handle errors (e.g., display a message to the user)
      console.log(result.error || "Login failed!"); // Display error toast
      toast({
        title: "Error !",
        description: `- ${result.error}`,
      });
    } else {
      toast({
        title: "Login Successful !",
        description: "- Redirecting to Dashboard",
      });
      console.log("Login Successful");
      setTimeout(() => {
        router.push(`/dashboard`); // Redirect to the user page
      }, 500); // Wait for 1 second before redirecting
    }
  };

  const formSchema = z.object({
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(3, "Password must be at least 3 characters."),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl p-4">
      <h2 className="text-5xl font-semibold">Login</h2>
      <Separator />
      <div className="flex flex-col gap-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="">
            <div className="grid  gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="testuser@teamrandom.com"
                        {...field}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="password"
                        {...field}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!isSubmitting ? (
              <Button className="w-full mt-4" type="submit">
                Submit
              </Button>
            ) : (
              <Button className="w-full mt-4" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
