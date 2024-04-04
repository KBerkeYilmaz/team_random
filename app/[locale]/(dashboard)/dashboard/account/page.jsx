import { EditUserForm } from "@/components/forms/EditUserForm";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getServerSession } from "next-auth";

const Account = async () => {
  const session = await getServerSession();
  console.log(session);

  return (
    <div className="h-full w-full flex flex-col gap-4 justify-start items-start p-10 animate-fadeIn">
      <h2 className="text-4xl font-semibold">My Account</h2>
      <Separator />
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col sm:flex-row gap-6 w-full">
          <div className=" w-60 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
            Image
          </div>
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Name: </Label>
              <p className="break-all">{session.user.name}</p>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Label className="text-md">Email: </Label>
              <p className="break-all">{session.user.email}</p>
            </div>
          </div>
        </div>
        <div>
          <EditUserForm user={session.user} />
        </div>
      </div>
    </div>
  );
};

export default Account;
