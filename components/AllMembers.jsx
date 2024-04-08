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
  return (
    <div className="flex flex-col gap-4 py-4 w-full">
      <DataTable rows={1} columns={columns} data={data} />
    </div>
  );
}
