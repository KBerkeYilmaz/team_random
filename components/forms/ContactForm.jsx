"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Textarea } from "../ui/textarea";
import { useToast } from "../ui/use-toast";
import { sendEmail } from "@/lib/sendMail";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email."),
  message: z.string().min(3, "Message must be at least 3 characters."),
});

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    const result = await sendEmail(values);

    if (result.error) {
      toast({
        variant: "destructive",
        title: result.message,
      });

      setIsSubmitting(false);
    } else {
      form.reset();
      toast({
        title: result.message,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 h-full w-full flex justify-center items-center">
      <div className="grid grid-cols-3 border p-4 bg-muted/80 shadow-lg rounded-lg w-[840px] h-fit md:p-10">
        <div className="col-span-1">
          <h1 className="text-3xl font-semibold pb-6">Send Us an Email!</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="yourmail@teamrandom.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Your message.." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!isSubmitting ? (
                <Button className="w-full mt-2" type="submit">
                  Submit
                </Button>
              ) : (
                <Button className="w-full mt-2" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              )}
            </form>
          </Form>
          <p className="text-xs text-center py-2">
            By pressing the button, you accept Terms and Conditions and
            acknowledge reading Privacy Policy.
          </p>
        </div>
        <div className="col-span-2"> </div>
      </div>
    </div>
  );
}
