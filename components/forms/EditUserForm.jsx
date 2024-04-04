"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEdgeStore } from "@/lib/edgestore";
import { SingleImageDropzone } from "@/components/SingleImageDropzone";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  fullName: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  userMail: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  password: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
});

export const EditUserForm = ({ user }) => {
  const [formData, setFormData] = useState({ fullName: "", userMail: "" });

  const [file, setFile] = useState();
  const { edgestore } = useEdgeStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="" variant="outline">
          Edit User Info
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="max-w-md overflow-auto p-6 flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Edit User Info</h2>
            <Separator />
            <form action="" className="space-y-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col w-full md:w-fit gap-2">
                  <div className=" w-32 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
                    Image
                  </div>
                </div>
                <div className="flex flex-col w-full  gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    name="fullName"
                    type="text"
                    required
                  />
                </div>
                <div className="flex flex-col w-full  gap-2">
                  <Label htmlFor="userMail">Email</Label>
                  <Input
                    placeholder="user@teamrandom.com"
                    name="userMail"
                    type="text"
                    required
                  />
                </div>
              </div>
              <Button className="w-full">Submit</Button>
            </form>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
