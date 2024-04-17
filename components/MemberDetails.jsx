"use client";
import { Loader2 } from "lucide-react";
import { Label } from "./ui/label";
import { deleteMember } from "@/actions/memberAction";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useToast } from "./ui/use-toast";
import { useRouter } from "@/navigation";
import { useState } from "react";
import { DeleteAlert } from "./DeleteAlert";
import Image from "next/image";
import { EditMemberForm } from "./forms/EditMemberForm";

export default function MemberDetails({ member }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!member) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  const handleDelete = () => {
    try {
      console.log(member.id);
      deleteMember(member.id);
      toast({
        title: `Member "${member.memberName}" deleted successfully !`,
      });
      router.push("/dashboard/members");
      console.log("Delete Successful");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col gap-4 justify-start items-start pb-28 p-10 animate-fadeIn overflow-y-scroll no-scrollbar">
      <h2 className="text-4xl font-semibold">Member Details</h2>
      <Separator />
      <div className="flex gap-4 w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          {member.memberImage === undefined || member.memberImage === "" ? (
            <div className=" w-60 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
              Image
            </div>
          ) : (
            <img
              src={member.memberImage}
              priority={false}
              alt="User Picture"
              className="w-[180px] h-[180px]"
            />
          )}
          <div className="flex flex-col w-full gap-1">
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Name: </Label>
              <p className="break-all">{member.memberName}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Title: </Label>
              <p className="break-all">{member.memberTitle}</p>
            </div>

            {member.memberPersonal && (
              <div className="flex items-center gap-1 w-full">
                <Label className="text-md">Personal: </Label>
                <p className="break-all">
                  {" "}
                  <a href={member.memberPersonal}> {member.memberPersonal}</a>
                </p>
              </div>
            )}
            {member.memberLinkedin && (
              <div className="flex items-center gap-1 w-full">
                <Label className="text-md">Linkedin: </Label>
                <p className="break-all">
                  {" "}
                  <a href={member.memberLinkedin}> {member.memberLinkedin}</a>
                </p>
              </div>
            )}
            {member.memberGithub && (
              <div className="flex items-center gap-1 w-full">
                <Label className="text-md">Github: </Label>
                <p className="break-all">
                  {" "}
                  <a href={member.memberGithub}> {member.memberGithub}</a>
                </p>
              </div>
            )}
            <div className="flex  gap-1 w-full">
              <Label className="text-md">Bio: </Label>
              <p className="break-all">{member.memberBio}</p>
            </div>
          </div>
        </div>
        <div>
          <Button onClick={() => setOpen(true)} variant="destructive">
            Delete Member
          </Button>
        </div>
        <DeleteAlert
          open={open}
          setOpen={setOpen}
          handleDelete={handleDelete}
        />
      </div>
      <EditMemberForm member={member} />
    </div>
  );
}
