import { getWork } from "@/actions/workAction";
import WorkDetails from "@/components/WorkDetails";

const WorkPage = async ({ params }) => {
  const work = await getWork(params.id);
  const filteredWork = {
    id: work.id,
    workTitle: work.workTitle,
    workGithubURL: work.workGithubURL,
    workAppURL: work.workAppURL,
    workReadme: work.workReadme,
    workImages: work.workImages,
    workTechStack: work.workTechStack,
  };
  console.log(filteredWork)
  return (
    <>
      <WorkDetails work={filteredWork} />
    </>
  );
};

export default WorkPage;
