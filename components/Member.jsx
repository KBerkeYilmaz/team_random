"use client";
import { Loader2 } from "lucide-react";
import { Label } from "./ui/label";
import Image from "next/image";
import { deleteMember } from "@/actions/memberAction";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export default function MemberDetails({ member }) {
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
      console.log("Delete Successful");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 justify-start items-start p-10 animate-fadeIn">
      <h2 className="text-4xl font-semibold">Member Details</h2>
      <Separator />
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          {member.memberImage === undefined ? (
            <div className=" w-60 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
              Image
            </div>
          ) : (
            <Image
              src={member.memberImage}
              width={80}
              height={80}
              priority={false}
              alt="User Picture"
            />
          )}
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Name: </Label>
              <p className="break-all">{member.memberName}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Bio: </Label>
              <p className="break-all">{member.memberBio}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Title: </Label>
              <p className="break-all">{member.memberTitle}</p>
            </div>
            {member.memberGithub && (
              <div className="flex items-center gap-1 w-full">
                <Label className="text-md">Github: </Label>
                <p className="break-all">{member.memberGithub}</p>
              </div>
            )}
            <div className="flex items-center gap-1 w-full"></div>
          </div>
        </div>
        <div>
          <Button onClick={handleDelete}>Delete Member</Button>
        </div>
      </div>
    </div>
  );
}
