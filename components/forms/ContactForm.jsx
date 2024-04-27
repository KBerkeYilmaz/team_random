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
    <div className="flex h-full w-full items-center justify-center sm:p-6">
      <div className="flex max-w-md flex-col rounded-b-lg border bg-muted/80 shadow-xl md:max-w-none md:flex-row md:rounded-l-lg">
        <div className="order-2 p-6 md:order-1 md:max-w-sm md:p-10 ">
          <h1 className=" pb-4 text-center text-2xl font-semibold md:pb-10 md:text-start md:text-4xl">
            Send Us an Email!
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex  flex-col gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className>Full Name</FormLabel>
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
                      <FormLabel className>Email</FormLabel>
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
                      <FormLabel className>Your message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Your message.." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!isSubmitting ? (
                <Button className="mt-3 w-full" type="submit">
                  Submit
                </Button>
              ) : (
                <Button className="mt-3 w-full" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              )}
            </form>
          </Form>
          <p className="py-2 text-center text-xs">
            By pressing the button, you accept Terms and Conditions and
            acknowledge reading Privacy Policy.
          </p>
        </div>

        <div className="order-1 flex flex-col items-center justify-center gap-6 rounded-t-lg bg-[url('/images/bg/team-hands-linked-together.webp')] bg-cover bg-center py-8 text-center text-white dark:bg-[url('/images/bg/team-hands-linked-together.webp')] sm:px-14 md:order-2 md:max-w-lg md:rounded-r-lg md:rounded-tl-none lg:min-w-[35rem] h-[20rem] md:h-auto md:w-[30rem]">
          {/* <h2 className="md:text-4xl text-2xl font-bold drop-shadow-xl px-6 sm:p-6 md:p-0">
            Lorem ipsum dolor sit amet consectetur.
          </h2>
          <p className="text-justify md:flex hidden">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Voluptatum, harum nam dolor numquam laborum eligendi magnam sit
            suscipit.
          </p> */}
        </div>
      </div>
    </div>
  );
}
