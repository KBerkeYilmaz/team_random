"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateMember, updateMemberImage } from "@/actions/memberAction";

const formSchema = z.object({
  memberName: z.string().min(3, "Member name must be at least 3 characters."),
  memberLastName: z.string().min(3, "Last name must be at least 3 characters."),
  memberTitle: z.string().min(3, "Title must be at least 3 characters."),
  memberBio: z.string().optional(), // Optional field
  memberPersonal: z.string().url().optional().or(z.literal("")), // Optional URL
  memberGithub: z.string().url().optional().or(z.literal("")), // Optional URL
  memberLinkedin: z.string().url().optional().or(z.literal("")), // Optional URL
  //   memberImage: z.string().url().optional().or(z.literal("")), // Optional URL
});

export const EditMemberForm = ({ member }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropzoneWidth, setDropzoneWidth] = useState(400); // Default width
  const [file, setFile] = useState();
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberName: member.memberName,
      memberLastName: member.memberLastName,
      memberTitle: member.memberTitle,
      memberBio: member.memberBio,
      memberPersonal: member.memberPersonal,
      memberGithub: member.memberGithub,
      memberLinkedin: member.memberLinkedin,
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    const result = await updateMember(values, member.id);

    if (file) {
      handlePicture();
    }

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error !",
        description: `- ${result.error}`,
      });

      setIsSubmitting(false);
    } else {
      toast({
        title: "Update Successful !",
      });
      setIsSubmitting(false);
    }
  };

  const handlePicture = async () => {
    if (file) {
      const res = await edgestore.publicFiles.upload({
        file,
        onProgressChange: (progress) => {
          // you can use this to show a progress bar
          console.log(progress);
        },
      });
      // you can run some server action or api here
      // to add the necessary data to your database
      console.log("handlePicture-res.url: ", res.url);
      // setImgUrl(res.url);
      handleUpdatePicture(res.url);
    }
  };

  const handleUpdatePicture = async (imgUrl) => {
    const result = await updateMemberImage(imgUrl, member.id);

    // console.log("handlePicture: ", file);
    // console.log("handlePicture: ", imgUrl);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error !",
        description: `- ${result.error}`,
      });
    } else {
    }
  };

  const updateDropzoneWidth = () => {
    const viewportWidth = window.innerWidth;
    const minWidth = 200;
    const maxWidth = 400;

    if (viewportWidth < 500) {
      const responsiveWidth = Math.max(minWidth, viewportWidth * 0.8); // Calculate 80% of viewport width or minWidth
      setDropzoneWidth(Math.min(responsiveWidth, maxWidth)); // Ensure width does not exceed maxWidth
    } else {
      setDropzoneWidth(maxWidth); // For larger screens, use maxWidth
    }
  };

  useEffect(() => {
    updateDropzoneWidth();
    window.addEventListener("resize", updateDropzoneWidth);
    return () => window.removeEventListener("resize", updateDropzoneWidth);
  }, []);

  //   console.log(file);
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-3xl font-semibold">Edit Member Info</h2>
      <Separator />
      <div className="flex flex-col w-full gap-2  max-w-5xl">
        <div className="flex-col flex gap-3 w-full">
          <Label className="" htmlFor="fullName">
            Member Image
          </Label>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col justify-between w-full gap-2">
              <div className="flex w-full ">
                <SingleImageDropzone
                  width={dropzoneWidth}
                  height={100}
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
              {/* {!isSubmitting ? (
                <Button onClick={handlePicture}>Update Image</Button>
              ) : (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              )} */}
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <div className="grid md:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="memberName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
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
                      <Input placeholder="shadcn" {...field} />
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
                      <Input placeholder="shadcn" {...field} />
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
                      <Input placeholder="shadcn" {...field} />
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
                      <Input placeholder="shadcn" {...field} />
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
                      <Input placeholder="shadcn" {...field} />
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
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div></div>
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
      </div>
    </div>
  );
};
