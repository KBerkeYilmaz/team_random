"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { EditUserForm } from "@/components/forms/EditUserForm";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function MyAccount() {
  const { data } = useSession();
  console.log(data);

  if (!data) {
    return <div>loading...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col gap-4 justify-start items-start p-10 animate-fadeIn">
      <h2 className="text-4xl font-semibold">My Account</h2>
      <Separator />
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          {data?.user.image === undefined ? (
            <div className=" w-60 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
              Image
            </div>
          ) : (
            <Image
              src={data?.user.image}
              width={240}
              height={240}
              priority={false}
              alt="User Picture"
            />
          )}

          <div className="flex flex-col w-full">
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Name: </Label>
              <p className="break-all">{data?.user.name}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Email: </Label>
              <p className="break-all">{data?.user.email}</p>
            </div>
          </div>
        </div>
        <div>
          <EditUserForm user={data?.user} />
        </div>
      </div>
    </div>
  );
}

export default MyAccount;
