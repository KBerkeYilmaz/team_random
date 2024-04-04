"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEdgeStore } from "@/lib/edgestore";
import { SingleImageDropzone } from "@/components/SingleImageDropzone";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  memberName: z.string().min(3, {
    message: "Member name must be at least 3 characters.",
  }),
  memberLastName: z.string().min(3, {
    message: "Last name must be at least 3 characters.",
  }),
  memberTitle: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  memberBio: z.string().optional(), // Optional field
  memberPersonal: z.string().url().optional(), // Optional URL
  memberGithub: z.string().url().optional(), // Optional URL
  memberLinkedin: z.string().url().optional(), // Optional URL
});

const NewMemberForm = () => {
  const [file, setFile] = useState();
  const { edgestore } = useEdgeStore();

  return (
    <div className="flex gap-4 flex-col-reverse sm:flex-row">
      <form
        action=""
        className="space-y-8"
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col w-full md:w-fit gap-2">
            <Label htmlFor="memberName">First Name</Label>
            <Input
              placeholder="First Name"
              name="memberName"
              type="text"
              className="block"
              required
            />
          </div>
          <div className="flex flex-col w-full md:w-fit gap-2">
            <Label htmlFor="memberLastName">Last Name</Label>
            <Input
              placeholder="Last Name"
              name="memberLastName"
              type="text"
              required
            />
          </div>
          <div className="flex flex-col w-full md:w-fit gap-2">
            <Label htmlFor="memberTitle">Title</Label>
            <Input
              placeholder="Title"
              name="memberTitle"
              type="text"
              required
            />
          </div>
        </div>
        <div className="flex flex-col flex-wrap gap-2 ">
          <Label htmlFor="memberBio">Bio (Optional)</Label>
          <Textarea
            name="memberBio"
            type="text"
            className="p-2"
          />
        </div>
        <Separator />

        <div className="flex flex-col">
          <h2 className="text-2xl mb-4">Links (Optional)</h2>
          <div className="flex gap-2 flex-wrap flex-col">
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="memberPersonal">Personal App</Label>
              <Input
                placeholder="Personal Link"
                name="memberPersonal"
                type="text"
              />
            </div>
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="memberGithub">Github</Label>
              <Input
                placeholder="Github Link"
                name="memberGithub"
                type="text"
              />
            </div>
            <div className="flex flex-col w-full gap-2">
              <Label htmlFor="memberLinkedin">LinkedIn</Label>
              <Input
                placeholder="Linkedin Link"
                name="memberLinkedin"
                type="text"
              />
            </div>
          </div>
        </div>
        <Button className="w-full">
          Add New Member
          </Button>
  
      </form>
      <div>
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
        <button
          onClick={async () => {
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
              console.log(res.url);
            }
          }}
        >
          Upload
        </button>
      </div>
    </div>
  );
};

export default NewMemberForm;
