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
import { updateWork } from "@/actions/workAction";
import { Textarea } from "../ui/textarea";
import { workSchema } from "@/actions/schemas";
import { type FileState } from "@/components/MultiImageDropzone";
import type { WorkFormData } from "@/actions/types";

export const EditWorkForm = ({
  work,
  user,
}: {
  work: WorkFormData;
  user: { role?: string | null };
}) => {
  const [pending, setPending] = useState(false);
  const [dropzoneWidth, setDropzoneWidth] = useState(400); // Default width
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const { edgestore } = useEdgeStore();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof workSchema>>({
    resolver: zodResolver(workSchema),
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

  const onSubmit = async (values: z.infer<typeof workSchema>) => {
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
    setPending(true);
    try {
      // First, handle the image uploads.
      const uploadPromises = fileStates.map((addedFileState) =>
        edgestore.publicFiles
          // fileStates here only ever hold freshly-dropped Files (never the
          // string-URL variant of FileState), so this cast is safe.
          .upload({ file: addedFileState.file as File })
          .then((res) => res.url),
      );
      // Wait for all uploads to finish.
      const imageURLs = await Promise.all(uploadPromises);
      // Add the imageURLs to the values.
      const dataWithImages = {
        ...values,
        workImages: [...work.workImages, ...imageURLs],
      };

      // Then, pass this updated data object to your API call function.
      const response = await updateWork(dataWithImages, work.id);
      if (response.error) {
        throw new Error(response.error);
      }

      // Handle success.
      toast({
        description: `${response.message}`,
      });

      setFileStates([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        description: `Error creating work: ${(error as Error).message || error}`,
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
    <div className="flex w-full flex-col gap-4">
      <h2 className="text-center text-3xl font-semibold md:text-start">
        Edit Work Info
      </h2>
      <Separator />
      <div className="flex w-full max-w-5xl flex-col gap-2">
        <div className="flex w-full flex-col gap-3">
          <Label className="text-lg" htmlFor="fullName">
            Work Image
          </Label>
          <div className="flex items-center justify-center gap-4">
            <div className="flex w-full flex-col justify-between gap-2">
              <div className="flex w-full justify-center sm:justify-start">
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
            </div>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <div className="grid gap-2 md:grid-cols-2">
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
                      <Textarea {...field} />
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
