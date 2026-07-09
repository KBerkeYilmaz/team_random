import { getWork } from "@/actions/workAction";
import WorkDetails from "@/components/WorkDetails";
import { notFound } from "next/navigation";

// `params` is typed SYNC here — Phase 4's Next 16 codemod makes it async.
const WorkPage = async ({ params }: { params: { id: string } }) => {
  const work = await getWork(params.id);
  // Getter union guard (Phase 3): getWork returns WorkDetail | { error } | null.
  // Previously `work.id` below dereferenced null/{error} and crashed — 404 instead.
  if (!work || "error" in work) notFound();
  const filteredWork = {
    id: work.id,
    workTitle: work.workTitle,
    workGithubURL: work.workGithubURL,
    workAppURL: work.workAppURL,
    workReadme: work.workReadme,
    workImages: work.workImages,
    workTechStack: work.workTechStack,
  };
  return (
    <>
      <WorkDetails work={filteredWork} />
    </>
  );
};

export default WorkPage;
