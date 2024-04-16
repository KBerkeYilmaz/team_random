import { getMember } from "@/actions/memberAction";
import MemberDetails from "@/components/MemberDetails";

const MemberPage = async ({ params }) => {
  const member = await getMember(params.id);

  return (
    <>
      <MemberDetails member={member} />
    </>
  );
};

export default MemberPage;
