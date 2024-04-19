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
import { useSession } from "next-auth/react";

export default function MemberDetails({ work }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { data } = useSession();
  if (!work) {
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
      console.log(work.id);
      deleteWork(work.id, data.user.role);
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
    <div className="h-screen w-full flex flex-col gap-4 justify-start items-center md:items-start pb-28 p-10 animate-fadeIn overflow-y-scroll no-scrollbar">
      <h2 className="text-4xl font-semibold sm:text-start text-center">
        Work Details
      </h2>
      <Separator />
      <div className="flex gap-4 w-full max-w-5xl flex-col lg:flex-row">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          <div className="flex justify-center w-full">
            {work.workImages.length === 0 ? (
              <div className=" w-60 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
                No Image
              </div>
            ) : (
              <div className="mx-4">
                <Carousel className="w-full max-w-xs">
                  <CarouselContent>
                    {work.workImages.map((workImage, index) => (
                      <CarouselItem key={index}>
                        <div className="flex justify-center w-full md:max-w-md">
                          <Card>
                            <CardContent className="flex aspect-square items-center justify-center p-6">
                              <span className="text-4xl font-semibold">
                                <img
                                  src={workImage}
                                  alt="Work Image"
                                  className="w-full"
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
          <div className="flex flex-col w-full ml-">
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Title: </Label>
              <p className="break-all">{work.workTitle}</p>
            </div>
            {work.workReadme && (
              <div className="flex items-center gap-1 w-full">
                <Label className="text-md">Readme: </Label>
                <p className="break-all">{work.workReadme}</p>
              </div>
            )}
            {work.workTechStack && (
              <div className="flex items-center gap-1 w-full">
                <Label className="text-md">TechStack: </Label>
                <p className="break-all">{work.workTechStack}</p>
              </div>
            )}
            {work.workAppURL && (
              <div className="flex items-center gap-1 w-full">
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
