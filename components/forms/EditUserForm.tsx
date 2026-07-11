"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { editUserSchema, type EditUserInput } from "@/actions/schemas";
import { updateUser, updateUserImage } from "@/actions/userActions";
import { SingleImageDropzone } from "@/components/SingleImageDropzone";
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
import { Separator } from "@/components/ui/separator";
import { useEdgeStore } from "@/lib/edgestore";

import { useToast } from "../ui/use-toast";

export const EditUserForm = ({
  user,
}: {
  user: { id: string; name: string; email: string; role?: string | null };
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropzoneWidth, setDropzoneWidth] = useState(400); // Default width

  const [file, setFile] = useState<File>();
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();

  const form = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const updateDropzoneWidth = () => {
    const viewportWidth = window.innerWidth;
    const minWidth = 200;
    const maxWidth = 400;

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

  const onSubmit = async (values: EditUserInput) => {
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
    const result = await updateUser(values, user.id);
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
    const result = await updateUserImage(imgUrl, user.id);

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

  return (
    <div className="flex w-full flex-col gap-4">
      <h2 className="text-center text-3xl font-semibold md:text-start">
        Edit User Info
      </h2>
      <Separator />
      <div className="flex max-w-2xl flex-col gap-2">
        <div className="flex flex-col gap-3">
          <Label className="text-lg" htmlFor="fullName">
            User Image
          </Label>
          <div className="flex items-center justify-center gap-4 ">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="">
            <div className="grid gap-2 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel className="font-bold">Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
