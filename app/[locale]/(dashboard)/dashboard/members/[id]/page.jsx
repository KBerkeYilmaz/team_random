import { getMember } from "@/actions/memberAction";
import MemberDetails from "@/components/Member";

const MemberPage = async ({ params }) => {
  const member = await getMember(params.id);
  const filteredMember = {
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
  return (
    <>
      <MemberDetails member={filteredMember} />
    </>
  );
};

export default MemberPage;
