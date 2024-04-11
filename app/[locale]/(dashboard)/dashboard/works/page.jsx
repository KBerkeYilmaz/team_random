import NewWorkForm from "@/components/forms/NewWorkForm";
import { columns } from "./columns";
import DataTable from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { getWorks } from "@/actions/workAction";
import { Loader2 } from "lucide-react";

const Works = async () => {
  const res = (await getWorks());
  
  if (!res) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  console.log("Response from server!!!:" , res);
  const data = res.map(item => ({
    id: item._id.toString(),
    workTitle: item.workTitle,
    workGithubURL: item.workGithubURL,
    workAppURL: item.workAppURL,
    workReadme: item.workReadme,
    workTechStack: item.workTechStack,
    // Uncomment other fields as necessary
    // workContributors: item.workContributors,
    // workImages: item.workImages,
  }));
  
  console.log("Here is ", data);

  return (
    <div className="h-full w-full p-10 animate-fadeIn">
      <h1 className="text-4xl font-semibold">Works</h1>
      <Separator className="my-4" />
      <div className="flex flex-col gap-4 py-4 w-full">
        <DataTable
          columns={columns}
          data={data}
          filterAnchor={"Title"}
          isMembersTable={false}
          tag={"work"}
        />
        {/* <NewWorkForm /> */}
      </div>
    </div>
  );
};

export default Works;
