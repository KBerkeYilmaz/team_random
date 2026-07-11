"use client";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const { email, password } = values;
    // AUDIT #87 (Phase 1): Better Auth email/password sign-in. The result shape is
    // { data, error } (was next-auth's { error }); on success the client sets the
    // session cookie, so we just redirect.
    const { error } = await signIn.email({ email, password });

    if (error) {
      setIsSubmitting(false);
      toast({
        title: "Error !",
        description: `- ${error.message}`,
      });
    } else {
      toast({
        title: "Login Successful !",
        description: "- Redirecting to Dashboard",
      });
      setTimeout(() => {
        router.push(`/dashboard`);
      }, 500);
    }
  };

  const formSchema = z.object({
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(3, "Password must be at least 3 characters."),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 p-4">
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
              <Button className="mt-4 w-full" type="submit">
                Submit
              </Button>
            ) : (
              <Button className="mt-4 w-full" disabled>
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
