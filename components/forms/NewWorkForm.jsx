"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEdgeStore } from "@/lib/edgestore";
import { Separator } from "@/components/ui/separator";
import { createWork } from "@/actions/workAction";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MultiImageDropzoneColumn } from "@/components/MultiImageDropzoneColumn";
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
import { useSession } from "next-auth/react";

const NewWorkForm = () => {
  const { edgestore } = useEdgeStore();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [fileStates, setFileStates] = useState([]);
  const { toast } = useToast();
  const { data } = useSession();

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
    if (data.user.role !== "admin") {
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

      // Add the imageURLs to the formData.
      const dataWithImages = {
        ...formData,
        workImages: imageURLs,
      };

      // Then, pass this updated data object to your API call function.
      const response = await createWork(dataWithImages, data.user.role);
      if (response.error) {
        throw new Error(response.error);
      }

      // Handle success.
      toast({
        description: `${response.message}`,
      });
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="" variant="outline">
          Create New Work
        </Button>
      </DialogTrigger>
      <DialogContent className="md:min-w-[800px] p-8">
        <DialogHeader className=" text-2xl md:text-4xl font-semibold">
          Create New Work
        </DialogHeader>
        <Separator />

        <div className="flex mt-2 gap-4  md:flex-row flex-col max-h-[430px] md:max-h-[540px]  overflow-y-scroll no-scrollbar">
          <div className="flex flex-col items-center md:items-start w-full md:w-fit gap-2">
            <MultiImageDropzoneColumn
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(newWork)} className="w-full">
              <div className="grid gap-2 px-2">
                <FormField
                  control={form.control}
                  name="workTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Title" {...field} />
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
                      <FormLabel>Github URL(opt)</FormLabel>
                      <FormControl>
                        <Input placeholder="Github URL" {...field} />
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
                      <FormLabel>App URL(opt)</FormLabel>
                      <FormControl>
                        <Input placeholder="App URL" {...field} />
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
                      <FormLabel>Tech Stack</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Stack" {...field} />
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
                      <FormLabel>Contributors (Opt)</FormLabel>
                      <FormControl>
                        <Input placeholder="Contributors" {...field} />
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
                      <FormLabel>Readme</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Readme" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!pending ? (
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

export default NewWorkForm;
