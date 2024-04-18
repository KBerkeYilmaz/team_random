"use client";

import { useState, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { useEdgeStore } from "@/lib/edgestore";
import { SingleImageDropzone } from "@/components/SingleImageDropzone";
import { Separator } from "@/components/ui/separator";
import { createMember } from "@/actions/memberAction";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
  memberName: z.string().min(3, "Member name must be at least 3 characters."),
  memberLastName: z.string().min(3, "Last name must be at least 3 characters."),
  memberTitle: z.string().min(3, "Title must be at least 3 characters."),
  memberBio: z.string().optional(),
  memberPersonal: z.string().url().optional().or(z.literal("")),
  memberGithub: z.string().url().optional().or(z.literal("")),
  memberLinkedin: z.string().url().optional().or(z.literal("")),
});

const NewMemberForm = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { edgestore } = useEdgeStore();
  const [pending, setPending] = useState(false);
  const [file, setFile] = useState();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberName: "",
      memberLastName: "",
      memberTitle: "",
      memberBio: "",
      memberPersonal: "",
      memberGithub: "",
      memberLinkedin: "",
      memberImage: "",
    },
  });
  const onSubmit = async (values) => {
    setIsSubmitting(true);
    if (file) {
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => {
          // you can use this to show a progress bar
          console.log(progress);
        },
      });
      console.log("handlePicture-res.url: ", res.url);

      const userInfo = { ...values, memberImage: res.url };
      const result = await createMember(userInfo);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error !",
          description: `- ${result.error}`,
        });
        setIsSubmitting(false);
      } else {
        toast({
          title: "New member created !",
        });
        setOpen(false);
        setIsSubmitting(false);
        form.reset();
      }
    } else {
      const userInfo = { ...values, memberImage: "" };
      const result = await createMember(userInfo);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error !",
          description: `- ${result.error}`,
        });
        setIsSubmitting(false);
      } else {
        toast({
          title: "New member created !",
        });
        setOpen(false);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="" variant="outline">
          Create New Member
        </Button>
      </DialogTrigger>
      <DialogContent className="md:min-w-[800px] p-8">
        <DialogHeader className=" text-2xl md:text-4xl font-semibold">
          Create New Member
        </DialogHeader>
        <Separator />
        <div className="flex mt-2 gap-4  md:flex-row flex-col max-h-[430px] md:max-h-[540px]  overflow-y-scroll no-scrollbar">
          <div className="flex flex-col items-center md:items-start w-full md:w-fit gap-2">
            <Label className="self-start" htmlFor="picture">
              Picture
            </Label>
            <SingleImageDropzone
              width={220}
              height={220}
              value={file}
              dropzoneOptions={{
                maxSize: 1024 * 1024 * 2, // 2MB
                maxFiles: 1,
              }}
              onChange={(file) => {
                setFile(file);
              }}
            />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
              <div className="grid md:grid-cols-2 gap-2 px-2">
                <FormField
                  control={form.control}
                  name="memberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memberLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memberTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="memberPersonal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memberGithub"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Github URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memberLinkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memberBio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
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
      </DialogContent>
    </Dialog>
  );
};

export default NewMemberForm;
