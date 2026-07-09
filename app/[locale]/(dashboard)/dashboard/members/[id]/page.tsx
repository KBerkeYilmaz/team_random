import { getMember } from "@/actions/memberAction";
import MemberDetails from "@/components/MemberDetails";
import { notFound } from "next/navigation";

// `params` is typed SYNC here — Phase 4's Next 16 codemod makes it async.
const MemberPage = async ({ params }: { params: { id: string } }) => {
  const member = await getMember(params.id);
  // Getter union guard (Phase 3): getMember returns MemberRow | { error } | null.
  // notFound() replaces the loader-forever a missing member previously showed.
  if (!member || "error" in member) notFound();

  return (
    <>
      <MemberDetails member={member} />
    </>
  );
};

export default MemberPage;
