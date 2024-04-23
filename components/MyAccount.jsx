"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { EditUserForm } from "@/components/forms/EditUserForm";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { EditUserPasswordForm } from "./forms/EditUserPasswordForm";

function MyAccount() {
  const { data } = useSession();

  if (!data) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }
  return (
    <div className="h-screen w-full flex flex-col gap-4 justify-start items-center md:items-start pb-28 p-10 animate-fadeIn overflow-y-scroll no-scrollbar">
      <h2 className="text-4xl font-semibold text-center sm:text-start ">
        My Account
      </h2>
      <Separator />
      <div className="flex flex-col gap-4 w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          <div className="flex sm:flex-row justify-center md:justify-start min-w-fit">
            {data?.user.image === "" ? (
              <div className=" w-40 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
                User Image
              </div>
            ) : (
              <img
                src={data?.user.image}
                alt="User Picture"
                className="md:w-[180px] w-[220px] sm:w-[250px] md:h-[180px] h-[220px] sm:h-[250px]"
              />
            )}
          </div>
          <div className="flex flex-col w-full">
            <div className="flex gap-1 w-full flex-col md:flex-row">
              <Label className="text-md font-bold dark:text-primary ">
                Name:{" "}
              </Label>
              <p className="break-all">{data?.user.name}</p>
            </div>
            <div className="flex gap-1 w-full flex-col md:flex-row">
              <Label className="text-md font-bold dark:text-primary ">
                Email:{" "}
              </Label>
              <p className="break-all">{data?.user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full gap-6 flex-wrap">
          <EditUserForm user={data?.user} />
          <EditUserPasswordForm user={data?.user} />
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
