import { getMembers } from "@/actions/memberAction";
import { Loader2 } from "lucide-react";
import { Label } from "./ui/label";
import { Link } from "@/navigation";
import Image from "next/image";

export default async function AllMembers() {
  const data = await getMembers();
  if (!data) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-4">
        {data.map((member, i) => {
          return (
            <div key={i} className="flex flex-wrap gap-4 w-full">
              <div className="flex sm:flex-row  gap-6 w-full">
                {member.memberImage === undefined ? (
                  <div className=" w-25 aspect-square bg-gray-800 text-white flex justify-center items-center rounded">
                    Image
                  </div>
                ) : (
                  <Image
                    src={member.memberImage}
                    width={25}
                    height={25}
                    priority={false}
                    alt="Member Picture"
                    className="aspect-square"
                  />
                )}
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-1 w-full">
                    <Label className="text-md">Name: </Label>
                    <p className="break-all">{member.memberName}</p>
                  </div>
                  <Link
                    href={`/dashboard/members/${member.id}`}
                    className="flex items-center gap-1 w-full"
                  >
                    See Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
