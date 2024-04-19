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
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useToast } from "../ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MultiImageDropzone } from "../MultiImageDropzone";
import { UpdateWork } from "@/actions/workAction";

const formSchema = z.object({
  workTitle: z.string().min(2, "Title must be at least 2 characters."),
  workGithubURL: z.string().url().optional().or(z.literal("")),
  workAppURL: z.string().url().optional().or(z.literal("")),
  workReadme: z.string().min(2, "Readme must be at least 2 characters."),
  workTechStack: z.string().min(2, "Tech Stack must be at least 2 characters."),
  workContributors: z.string().optional(), // Assuming contributors is an array of strings
  // workImages: z.array().url().optional().or(z.literal("")),
  workImages: z.array(z.string().url()).optional(),
});

export const EditWorkForm = ({ work, user }) => {
  const [pending, setPending] = useState(false);
  const [dropzoneWidth, setDropzoneWidth] = useState(400); // Default width
  const [fileStates, setFileStates] = useState([]);
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workTitle: work.workTitle,
      workGithubURL: work.workGithubURL,
      workAppURL: work.workAppURL,
      workReadme: work.workReadme,
      workImages: work.workImages,
      workTechStack: work.workTechStack,
      workContributors: work.workContributors,
    },
  });

  const onSubmit = async (values) => {
    if (user.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Error !",
        description: `- Unauthorised !`,
      });
      return;
    }
    setPending(true);
    try {
      // First, handle the image uploads.
      const uploadPromises = fileStates.map((addedFileState) =>
        edgestore.publicFiles
          .upload({ file: addedFileState.file })
          .then((res) => res.url)
      );
      // Wait for all uploads to finish.
      const imageURLs = await Promise.all(uploadPromises);
      // Add the imageURLs to the values.
      const dataWithImages = {
        ...values,
        workImages: [...work.workImages, ...imageURLs],
      };

      // Then, pass this updated data object to your API call function.
      const response = await UpdateWork(dataWithImages, work.id);
      if (response.error) {
        throw new Error(response.error);
      }

      // Handle success.
      toast({
        description: `${response.message}`,
      });

      // Reset form and state as needed.
      form.reset();
      setFileStates([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        description: `Error creating work: ${error.message || error}`,
      });
    } finally {
      setPending(false);
    }
  };

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

  //   console.log(file);
  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-3xl font-semibold md:text-start text-center">
        Edit Member Info
      </h2>
      <Separator />
      <div className="flex flex-col w-full gap-2 max-w-5xl">
        <div className="flex-col flex gap-3 w-full">
          <Label className="text-lg" htmlFor="fullName">
            Member Image
          </Label>
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col justify-between w-full gap-2">
              <div className="flex w-full justify-center md:justify-start">
                <MultiImageDropzone
                  value={fileStates}
                  dropzoneOptions={{
                    maxFiles: 6,
                  }}
                  onChange={(files) => {
                    setFileStates(files);
                  }}
                  onFilesAdded={(addedFiles) => {
                    setFileStates([...fileStates, ...addedFiles]);
                  }}
                />
              </div>
              {/* {!pending ? (
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
                name="workTitle"
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
                name="workGithubURL"
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
                name="workAppURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">App URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workReadme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Readme</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workTechStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Tech Stack</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workContributors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Contributors</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!pending ? (
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
