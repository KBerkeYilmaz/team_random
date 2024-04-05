import { EditUserForm } from "@/components/forms/EditUserForm";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getServerSession } from "next-auth";
import Image from "next/image";

const Account = async () => {
  const { user } = await getServerSession();

  return (
    <div className="h-full w-full flex flex-col gap-4 justify-start items-start p-10 animate-fadeIn">
      <h2 className="text-4xl font-semibold">My Account</h2>
      <Separator />
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          {user.image === undefined ? (
            <div className=" w-60 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
              Image
            </div>
          ) : (
            <Image
              src={user.image}
              width={240}
              height={240}
              alt="User Picture"
            />
          )}

          <div className="flex flex-col w-full">
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Name: </Label>
              <p className="break-all">{user.name}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Email: </Label>
              <p className="break-all">{user.email}</p>
            </div>
          </div>
        </div>
        <div>
          <EditUserForm user={user} />
        </div>
      </div>
    </div>
  );
};

export default Account;