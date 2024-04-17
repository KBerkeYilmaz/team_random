"use client";
import { Loader2 } from "lucide-react";
import { Label } from "./ui/label";
import { deleteWork } from "@/actions/workAction";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useToast } from "./ui/use-toast";
import { useRouter } from "@/navigation";
import { useState } from "react";
import { DeleteAlert } from "./DeleteAlert";
import Image from "next/image";
import { EditMemberForm } from "./forms/EditMemberForm";
import { EditWorkForm } from "./forms/EditWorkForm";

export default function MemberDetails({ work }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!work) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  const handleDelete = () => {
    try {
      console.log(work.id);
      deleteWork(work.id);
      toast({
        title: `Member "${work.Title}" deleted successfully !`,
      });
      router.push("/dashboard/works");
      console.log("Delete Successful");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 justify-start items-start p-10 animate-fadeIn">
      <h2 className="text-4xl font-semibold">Work Details</h2>
      <Separator />
      <div className="flex flex-col sm:flex-row gap-4 w-full  max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          {work.workImage === undefined ? (
            <div className=" w-60 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
              Image
            </div>
          ) : (
            <Image
              src={work.workImage}
              width={80}
              height={80}
              priority={false}
              alt="User Picture"
            />
          )}
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Title: </Label>
              <p className="break-all">{work.workTitle}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Readme: </Label>
              <p className="break-all">{work.workReadme}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">TechStack: </Label>
              <p className="break-all">{work.workTechStack}</p>
            </div>
            {/* {work.workGithub && (
              <div className="flex items-center gap-1 w-full">
                <Label className="text-md">Github: </Label>
                <p className="break-all">{work.workGithub}</p>
              </div>
            )} */}
            <div className="flex items-center gap-1 w-full"></div>
          </div>
        </div>
        <div>
          <Button onClick={() => setOpen(true)} variant="destructive">
            Delete Work
          </Button>
        </div>
        <DeleteAlert
          open={open}
          setOpen={setOpen}
          handleDelete={handleDelete}
        />
      </div>
      <EditWorkForm work={work} />
    </div>
  );
}
