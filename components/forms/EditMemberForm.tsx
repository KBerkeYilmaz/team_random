"use client";

import { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateMember, updateMemberImage } from "@/actions/memberAction";
import { updateMemberSchema } from "@/actions/schemas";
import type { MemberRow } from "@/actions/types";

export const EditMemberForm = ({
  member,
  user,
}: {
  member: MemberRow;
  user: { role?: string | null };
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropzoneWidth, setDropzoneWidth] = useState(400); // Default width
  const [file, setFile] = useState<File>();
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof updateMemberSchema>>({
    resolver: zodResolver(updateMemberSchema),
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

  const onSubmit = async (values: z.infer<typeof updateMemberSchema>) => {
    // AUDIT #83: UX hint only, NOT the security boundary — real authorization is
    // enforced server-side in the action (requireAdmin). Kept for a friendly toast.
    if (user.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Error !",
        description: `- Unauthorised !`,
      });
      return;
    }
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

  const handleUpdatePicture = async (imgUrl: string) => {
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
    const minWidth = 100;
    const maxWidth = 150;

    if (viewportWidth < 500) {
      const responsiveWidth = Math.max(minWidth, viewportWidth * 0.7); // Calculate 80% of viewport width or minWidth
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
    <div className="flex w-full flex-col gap-4">
      <h2 className="text-center text-3xl font-semibold md:text-start">
        Edit Member Info
      </h2>
      <Separator />
      <div className="flex w-full max-w-5xl flex-col gap-2">
        <div className="flex w-full flex-col gap-3">
          <Label className="text-lg" htmlFor="fullName">
            Member Image
          </Label>
          <div className="flex items-center justify-center gap-4">
            <div className="flex w-full flex-col justify-between gap-2">
              <div className="flex w-full justify-center md:justify-start">
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
            <div className="grid gap-2 md:grid-cols-2">
              <FormField
                control={form.control}
                name="memberName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Name</FormLabel>
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
                    <FormLabel className="font-bold">Last Name</FormLabel>
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
                    <FormLabel className="font-bold">Title</FormLabel>
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
                    <FormLabel className="font-bold">Bio</FormLabel>
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
                    <FormLabel className="font-bold">Personal URL</FormLabel>
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
                    <FormLabel className="font-bold">Github URL</FormLabel>
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
                    <FormLabel className="font-bold">LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div></div>
            </div>

            {!isSubmitting ? (
              <Button className="mt-2 w-full" type="submit">
                Submit
              </Button>
            ) : (
              <Button className="mt-2 w-full" disabled>
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
