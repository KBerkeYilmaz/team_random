import AllMembers from "@/components/AllMembers";
import { Separator } from "@/components/ui/separator";

const Members = () => {
  return (
    <div className="h-full w-full flex flex-col justify-start items-start p-10 animate-fadeIn">
      <h1 className="text-4xl mb-4 font-semibold">Members</h1>
      <Separator />
      <AllMembers />
    </div>
  );
};

export default Members;
