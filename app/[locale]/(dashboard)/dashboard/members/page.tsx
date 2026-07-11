import { Separator } from "@/components/ui/separator";
import { getMembers } from "@/actions/memberAction";
import { Loader2 } from "lucide-react";
import { columns } from "@/app/[locale]/(dashboard)/dashboard/members/columns";
import DataTable from "@/components/ui/data-table";

const Members = async () => {
  const data = await getMembers();

  // Getter union guard (Phase 3): render the existing loader fallback if
  // getMembers returned its { error } shape (or nothing) instead of the array.
  if (!data || "error" in data) {
    return (
      <div className="mt-10 flex w-full justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full animate-fadeIn flex-col items-start justify-start p-10">
      <h1 className="mb-4 w-full text-center text-4xl font-semibold md:text-start">
        Members
      </h1>
      <Separator />
      <DataTable
        columns={columns}
        data={data}
        filterAnchor={"Name"}
        tag="member"
      />
    </div>
  );
};

export default Members;
