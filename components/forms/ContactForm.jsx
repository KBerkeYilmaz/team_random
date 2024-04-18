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
    <div className="sm:p-6 h-full w-full flex justify-center items-center">
      <div className="flex flex-col md:flex-row border bg-muted/80 shadow-xl rounded-b-lg md:rounded-l-lg max-w-md md:max-w-none">
        <div className="md:max-w-sm p-6 md:p-10 md:order-1 order-2 ">
          <h1 className=" text-2xl md:text-4xl font-semibold pb-10">
            Send us an email!
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
                <Button className="w-full mt-3" type="submit">
                  Submit
                </Button>
              ) : (
                <Button className="w-full mt-3" disabled>
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

        <div className="bg-[url('/images/contact.svg')] dark:bg-[url('/images/contact-dark.svg')] md:max-w-lg py-4 sm:px-14 flex flex-col justify-center items-center text-center text-white gap-6 rounded-t-lg md:rounded-tl-none md:rounded-r-lg md:order-2 order-1 bg-cover bg-center">
          <h2 className="md:text-4xl text-2xl font-bold drop-shadow-xl px-6 sm:p-6 md:p-0">
            Lorem ipsum dolor sit amet consectetur.
          </h2>
          <p className="text-justify md:flex hidden">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Voluptatum, harum nam dolor numquam laborum eligendi magnam sit
            suscipit.
          </p>
        </div>
      </div>
    </div>
  );
}
