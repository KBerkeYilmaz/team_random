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
import { useSession } from "next-auth/react";

export default function MemberDetails({ member }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { data } = useSession();
  if (!member) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  const handleDelete = () => {
    if (data.user.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Error !",
        description: `- Unauthorised !`,
      });
      return;
    }

    try {
      console.log(member.id);
      deleteMember(member.id, data.user.role);
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
    <div className="h-screen w-full flex flex-col gap-4 justify-start items-center md:items-start pb-28 p-10 animate-fadeIn overflow-y-scroll no-scrollbar">
      <h2 className="text-4xl font-semibold sm:text-start text-center">
        Member Details
      </h2>
      <Separator />
      <div className="flex gap-4 w-full max-w-5xl flex-col lg:flex-row">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          <div className="flex sm:flex-row justify-center md:justify-start min-w-fit">
            {member.memberImage === undefined || member.memberImage === "" ? (
              <div className=" w-[180px] aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
                Image
              </div>
            ) : (
              <img
                src={member.memberImage}
                alt="User Picture"
                className="md:w-[180px] w-[220px] sm:w-[250px] md:h-[180px] h-[220px] sm:h-[250px]"
              />
            )}
          </div>
          <div className="flex flex-col w-full gap-2">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              <div className="flex gap-1 w-full flex-col md:flex-row">
                <Label className="text-md font-bold dark:text-primary ">
                  Full Name:{" "}
                </Label>
                <p className="break-all sm:text-start text-justify">
                  {member.memberName} {member.memberLastName}
                </p>
              </div>
              <div className="flex gap-1 w-full flex-col md:flex-row">
                <Label className="text-md font-bold">Title: </Label>
                <p className="break-all sm:text-start text-justify">
                  {member.memberTitle}
                </p>
              </div>
              {member.memberPersonal && (
                <div className="flex gap-1 w-full flex-col md:flex-row">
                  <Label className="text-md font-bold">Personal: </Label>
                  <p className="break-all sm:text-start text-justify">
                    {" "}
                    <a href={member.memberPersonal}> {member.memberPersonal}</a>
                  </p>
                </div>
              )}
              {member.memberLinkedin && (
                <div className="flex gap-1 w-full flex-col md:flex-row">
                  <Label className="text-md font-bold">Linkedin: </Label>
                  <p className="break-all sm:text-start text-justify">
                    {" "}
                    <a href={member.memberLinkedin}> {member.memberLinkedin}</a>
                  </p>
                </div>
              )}
              {member.memberGithub && (
                <div className="flex gap-1 w-full flex-col md:flex-row">
                  <Label className="text-md font-bold">Github: </Label>
                  <p className="break-all sm:text-start text-justify">
                    <a href={member.memberGithub}> {member.memberGithub}</a>
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-1 w-full flex-col md:flex-row">
              <Label className="text-md font-bold">Bio: </Label>
              <p className="break-all sm:text-start text-justify">
                {member.memberBio}
              </p>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-fit">
          <Button
            className="w-full sm:w-fit"
            onClick={() => setOpen(true)}
            variant="destructive"
          >
            Delete Member
          </Button>
        </div>
        <DeleteAlert
          open={open}
          setOpen={setOpen}
          handleDelete={handleDelete}
        />
      </div>
      <EditMemberForm user={data.user} member={member} />
    </div>
  );
}
