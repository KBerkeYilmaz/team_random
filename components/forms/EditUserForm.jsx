"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { z } from "zod";
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
import { updateUserImage, updateUserName } from "@/actions/userActions";
import { useToast } from "../ui/use-toast";
// const formSchema = z.object({
//   fullName: z.string().min(3, {
//     message: "Name must be at least 3 characters.",
//   }),
//   userMail: z.string().min(3, {
//     message: "Name must be at least 3 characters.",
//   }),
//   password: z.string().min(3, {
//     message: "Name must be at least 3 characters.",
//   }),
// });
export const EditUserForm = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  // const [imgUrl, setImgUrl] = useState("");
  const [file, setFile] = useState();
  const { edgestore } = useEdgeStore();

  const { toast } = useToast();

  const handleFullName = async () => {
    const result = await updateUserName(fullName, user.email);
    console.log(fullName);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error !",
        description: `- ${result.error}`,
      });
    } else {
      toast({
        title: "Update Successful !",
        description: `- User name updated to: "${fullName}"`,
      });
      setOpen(false);
    }
  };

  const handlePicture = async (imgUrl) => {
    const result = await updateUserImage(imgUrl, user.email);
    console.log("handlePicture: ", file);
    console.log("handlePicture: ", imgUrl);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error !",
        description: `- ${result.error}`,
      });
    } else {
      toast({
        title: "Update Successful !",
        // description: `- User name updated to: "${fullName}"`,
      });
      setOpen(false);
    }
  };

  useEffect(() => {
    setFullName(user.name);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <div className="flex-col flex gap-3">
              <Label className="text-lg" htmlFor="fullName">
                User Image
              </Label>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col justify-between w-full gap-2">
                  <div className="flex w-full justify-center">
                    <SingleImageDropzone
                      width={400}
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
                  <Button
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
                        // setImgUrl(res.url);
                        handlePicture(res.url);
                      }
                    }}
                  >
                    Update Image
                  </Button>
                </div>
              </div>
            </div>
            <form action={handleFullName} className="flex-col flex gap-3">
              <Label className="text-lg" htmlFor="fullName">
                Full Name
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex flex-col justify-between w-full gap-2">
                  <Input
                    placeholder="John Doe"
                    name="fullName"
                    type="text"
                    defaultValue={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <Button>Update</Button>
              </div>
            </form>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
