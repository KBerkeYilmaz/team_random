import { getMembers } from "@/actions/memberAction";
import { Loader2 } from "lucide-react";
import { columns } from "./members-table/columns";
import { DataTable } from "./members-table/dataTable";

export default async function AllMembers() {
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
    <div className="flex flex-col gap-4 py-4 w-full">
      <DataTable rows={1} columns={columns} data={refactoredData} />
    </div>
  );
}
