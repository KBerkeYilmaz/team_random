import { Separator } from "@/components/ui/separator";
import { getMembers } from "@/actions/memberAction";
import { Loader2 } from "lucide-react";
import { columns } from "@/app/[locale]/(dashboard)/dashboard/members/columns";
import DataTable from "@/components/ui/data-table";

const Members = async () => {
  const data = await getMembers();

  if (!data) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  const refactoredData = data.map((member) => {
    return {
      memberName: member.memberName,
      memberLastName: member.memberLastName,
      memberTitle: member.memberTitle,
      memberBio: member.memberBio,
      memberGithub: member.memberGithub,
      memberPersonal: member.memberPersonal,
      memberLinkedin: member.memberLinkedin,
      memberImage: member.memberImage,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      id: member.id,
    };
  });

  return (
    <div className="h-full w-full flex flex-col justify-start items-start p-10 animate-fadeIn">
      <h1 className="text-4xl mb-4 font-semibold">Members</h1>
      <Separator />
      <DataTable
        columns={columns}
        data={refactoredData}
        filterAnchor={"Name"}
        tag="member"
      />
    </div>
  );
};

export default Members;
