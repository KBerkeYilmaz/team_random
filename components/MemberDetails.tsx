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
import { useSession } from "@/lib/auth-client";
import type { MemberRow } from "@/actions/types";

export default function MemberDetails({ member }: { member: MemberRow }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { data } = useSession();
  // AUDIT #87 (Phase 1): also wait for the Better Auth session (data) before
  // rendering, since data.user is read below and useSession resolves async.
  if (!member || !data) {
    return (
      <div className="mt-10 flex w-full justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  const handleDelete = () => {
    // AUDIT #83: UX hint only, NOT the security boundary — real authorization is
    // enforced server-side in the action (requireAdmin). Kept for a friendly toast.
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
    <div className="no-scrollbar flex h-screen w-full animate-fadeIn flex-col items-center justify-start gap-4 overflow-y-scroll p-10 pb-28 md:items-start">
      <h2 className="text-center text-4xl font-semibold sm:text-start">
        Member Details
      </h2>
      <Separator />
      <div className="flex w-full max-w-5xl flex-col gap-4 lg:flex-row">
        <div className="flex w-full flex-col gap-6 sm:flex-row">
          <div className="flex min-w-fit justify-center sm:flex-row md:justify-start">
            {member.memberImage === undefined || member.memberImage === "" ? (
              <div className=" flex aspect-square w-[180px] items-center justify-center rounded bg-gray-800 text-white">
                Image
              </div>
            ) : (
              <img
                src={member.memberImage}
                alt="User Picture"
                className="h-[220px] w-[220px] sm:h-[250px] sm:w-[250px] md:h-[180px] md:w-[180px]"
              />
            )}
          </div>
          <div className="flex w-full flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              <div className="flex w-full flex-col gap-1 md:flex-row">
                <Label className="text-md font-bold dark:text-primary ">
                  Full Name:{" "}
                </Label>
                <p className="break-all text-justify sm:text-start">
                  {member.memberName} {member.memberLastName}
                </p>
              </div>
              <div className="flex w-full flex-col gap-1 md:flex-row">
                <Label className="text-md font-bold">Title: </Label>
                <p className="break-all text-justify sm:text-start">
                  {member.memberTitle}
                </p>
              </div>
              {member.memberPersonal && (
                <div className="flex w-full flex-col gap-1 md:flex-row">
                  <Label className="text-md font-bold">Personal: </Label>
                  <p className="break-all text-justify sm:text-start">
                    {" "}
                    <a href={member.memberPersonal}> {member.memberPersonal}</a>
                  </p>
                </div>
              )}
              {member.memberLinkedin && (
                <div className="flex w-full flex-col gap-1 md:flex-row">
                  <Label className="text-md font-bold">Linkedin: </Label>
                  <p className="break-all text-justify sm:text-start">
                    {" "}
                    <a href={member.memberLinkedin}> {member.memberLinkedin}</a>
                  </p>
                </div>
              )}
              {member.memberGithub && (
                <div className="flex w-full flex-col gap-1 md:flex-row">
                  <Label className="text-md font-bold">Github: </Label>
                  <p className="break-all text-justify sm:text-start">
                    <a href={member.memberGithub}> {member.memberGithub}</a>
                  </p>
                </div>
              )}
            </div>
            <div className="flex w-full flex-col gap-1 md:flex-row">
              <Label className="text-md font-bold">Bio: </Label>
              <p className="break-all text-justify sm:text-start">
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
