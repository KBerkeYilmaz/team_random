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
import { EditWorkForm } from "./forms/EditWorkForm";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSession } from "@/lib/auth-client";
import type { WorkFormData } from "@/actions/types";

export default function MemberDetails({ work }: { work: WorkFormData }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { data } = useSession();
  // AUDIT #87 (Phase 1): also wait for the Better Auth session (data) before
  // rendering, since data.user is read below and useSession resolves async.
  if (!work || !data) {
    return (
      <div className="mt-10 flex w-full justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }
  console.log(work);
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
      console.log(work.id);
      deleteWork(work.id);
      toast({
        title: `Work "${work.workTitle}" deleted successfully !`,
      });
      router.push("/dashboard/works");
      console.log("Delete Successful");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="no-scrollbar flex h-screen w-full animate-fadeIn flex-col items-center justify-start gap-4 overflow-y-scroll p-10 pb-28 md:items-start">
      <h2 className="text-center text-4xl font-semibold sm:text-start">
        Work Details
      </h2>
      <Separator />
      <div className="flex w-full max-w-5xl flex-col gap-4 lg:flex-row">
        <div className="flex w-full flex-col gap-6 sm:flex-row">
          <div className="flex w-full justify-center">
            {work.workImages.length === 0 ? (
              <div className=" flex aspect-square w-60 items-center justify-center rounded bg-gray-800 text-white">
                No Image
              </div>
            ) : (
              <div className="mx-4">
                <Carousel className="w-full max-w-xs">
                  <CarouselContent>
                    {work.workImages.map((workImage, index) => (
                      <CarouselItem key={index}>
                        <div className="flex w-full justify-center md:max-w-md">
                          <Card>
                            <CardContent className="flex aspect-square items-center justify-center p-6">
                              <span className="text-4xl font-semibold">
                                <img
                                  src={workImage}
                                  alt="Work Image"
                                  className="h-40 max-h-40 w-40 object-fill"
                                />
                              </span>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            )}
          </div>
          <div className="ml- flex w-full flex-col">
            <div className="flex w-full items-center gap-1">
              <Label className="text-md">Title: </Label>
              <p className="break-all">{work.workTitle}</p>
            </div>
            {work.workReadme && (
              <div className="flex w-full items-center gap-1">
                <Label className="text-md">Readme: </Label>
                <p className="break-all">{work.workReadme}</p>
              </div>
            )}
            {work.workTechStack && (
              <div className="flex w-full items-center gap-1">
                <Label className="text-md">TechStack: </Label>
                <p className="break-all">{work.workTechStack}</p>
              </div>
            )}
            {work.workAppURL && (
              <div className="flex w-full items-center gap-1">
                <Label className="text-md">App URL: </Label>
                <p className="break-all">{work.workAppURL}</p>
              </div>
            )}
          </div>
        </div>
        <div className="w-full sm:w-fit">
          <Button
            className="w-full sm:w-fit"
            onClick={() => setOpen(true)}
            variant="destructive"
          >
            Delete Work
          </Button>
        </div>
        <DeleteAlert
          open={open}
          setOpen={setOpen}
          handleDelete={handleDelete}
        />
      </div>
      <EditWorkForm user={data.user} work={work} />
    </div>
  );
}
