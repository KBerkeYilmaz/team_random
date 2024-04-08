import { getMembers } from "@/actions/memberAction";
import Member from "./Member";
import { Loader2 } from "lucide-react";

export default async function AllMembers() {
  const data = await getMembers();
  console.log("allmembers:", data);
  if (!data) {
    return (
      <div className="flex w-full justify-center mt-10">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <h1>All Members</h1>
      <div className="flex flex-wrap gap-4">
        {data.map((member, i) => {
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
          };
          return <Member key={i} member={filteredMember} />;
        })}
      </div>
    </div>
  );
}
