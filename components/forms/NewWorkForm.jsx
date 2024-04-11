"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEdgeStore } from "@/lib/edgestore";
import { Separator } from "@/components/ui/separator";
import { createWork } from "@/actions/workAction";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MultiImageDropzone } from "@/components/MultiImageDropzone";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";

const NewWorkForm = () => {
  const { edgestore } = useEdgeStore();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [fileStates, setFileStates] = useState([]);
  const { toast } = useToast();

  const newWorkSchema = z.object({
    workTitle: z.string().min(2, {
      message: "Title must be at least 2 characters.",
    }),
    workGithubURL: z.string().url().optional().or(z.literal("")),
    workAppURL: z.string().url().optional().or(z.literal("")),
    workReadme: z.string().min(2, {
      message: "Readme must be at least 2 characters.",
    }),
    workTechStack: z.string().min(2, {
      message: "Tech Stack must be at least 2 characters.",
    }),
    workContributors: z.string().optional(),
    // workImages: z.array().url().optional().or(z.literal("")),
    workImages: z.array(z.string().url()).optional(),
  });

  const form = useForm({
    resolver: zodResolver(newWorkSchema),
    defaultValues: {
      workTitle: "",
      workGithubURL: "",
      workAppURL: "",
      workReadme: "",
      workTechStack: "",
      workContributors: "",
      workImages: [],
    },
  });

  async function newWork(formData) {
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

      // Add the imageURLs to the formData.
      const dataWithImages = {
        ...formData,
        workImages: imageURLs,
      };

      // Then, pass this updated data object to your API call function.
      const response = await createWork(dataWithImages);
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
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          className=""
          variant="outline"
        >
          Create New Work
        </Button>
      </DialogTrigger>
      <DialogContent className="md:min-w-[800px] p-8  overflow-y-auto max-h-[90%]">
        <DialogHeader className=" text-2xl md:text-4xl font-semibold">
          Create New Work
        </DialogHeader>
        <Separator />

        <div className="flex gap-4 flex-col-reverse sm:flex-row w-full">
          <div className="min-w-[50%]">
            <Form
              {...form}
            >
              <form
                onSubmit={form.handleSubmit(newWork)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="workTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator />
                <div className="flex flex-col w-full gap-4">
                  <FormField
                    control={form.control}
                    name="workGithubURL"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Github URL(opt)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Github URL"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workAppURL"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>App URL(opt)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="App URL"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col w-full gap-4">
                  <FormField
                    control={form.control}
                    name="workReadme"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Readme</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Readme"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="workTechStack"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Tech Stack</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Tech Stack"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="workContributors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contributors (Opt)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contributors"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={pending}
                  className={`w-full`}
                >
                  {pending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Add new work"
                  )}
                </Button>
              </form>
            </Form>
          </div>
          <div className="overflow-y-auto max-h-full">
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
      </DialogContent>
    </Dialog>
  );
};

export default NewWorkForm;
