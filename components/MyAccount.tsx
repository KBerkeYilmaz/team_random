"use client";
import { useSession } from "@/lib/auth-client";
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
      <div className="mt-10 flex w-full justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }
  return (
    <div className="no-scrollbar flex h-screen w-full animate-fadeIn flex-col items-center justify-start gap-4 overflow-y-scroll p-10 pb-28 md:items-start">
      <h2 className="text-center text-4xl font-semibold sm:text-start ">
        My Account
      </h2>
      <Separator />
      <div className="flex w-full max-w-5xl flex-col gap-4">
        <div className="flex w-full flex-col gap-6 sm:flex-row">
          <div className="flex min-w-fit justify-center sm:flex-row md:justify-start">
            {data?.user.image === "" ? (
              <div className=" flex aspect-square w-40 items-center justify-center rounded bg-gray-800 text-white">
                User Image
              </div>
            ) : (
              // better-auth types `user.image` as `string | null | undefined`, but
              // the <img> `src` attribute only accepts `string | undefined`. Narrow
              // away the possible `null` with a type-only assertion (no runtime change).
              <img
                src={data?.user.image as string | undefined}
                alt="User Picture"
                className="h-[220px] w-[220px] sm:h-[250px] sm:w-[250px] md:h-[180px] md:w-[180px]"
              />
            )}
          </div>
          <div className="flex w-full flex-col">
            <div className="flex w-full flex-col gap-1 md:flex-row">
              <Label className="text-md font-bold dark:text-primary ">
                Name:{" "}
              </Label>
              <p className="break-all">{data?.user.name}</p>
            </div>
            <div className="flex w-full flex-col gap-1 md:flex-row">
              <Label className="text-md font-bold dark:text-primary ">
                Email:{" "}
              </Label>
              <p className="break-all">{data?.user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-6">
          <EditUserForm user={data?.user} />
          <EditUserPasswordForm user={data?.user} />
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
