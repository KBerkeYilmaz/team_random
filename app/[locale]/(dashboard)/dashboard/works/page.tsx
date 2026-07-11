import NewWorkForm from "@/components/forms/NewWorkForm";
import { columns } from "./columns";
import DataTable from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { getWorks } from "@/actions/workAction";
import { Loader2 } from "lucide-react";

const Works = async () => {
  const res = await getWorks();

  // Getter union guard (Phase 3): render the existing loader fallback if getWorks
  // returned its { error } shape (or nothing) instead of the works array.
  if (!res || "error" in res) {
    return (
      <div className="mt-10 flex w-full justify-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full animate-fadeIn p-10">
      <h1 className="w-full text-center text-4xl font-semibold  md:text-start">
        Works
      </h1>
      <Separator className="my-4" />
      <div className="flex w-full flex-col gap-4 py-4">
        <DataTable
          columns={columns}
          data={res}
          filterAnchor={"Title"}
          tag={"work"}
        />
      </div>
    </div>
  );
};

export default Works;
