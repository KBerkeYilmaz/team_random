import AllMembers from "@/components/AllMembers";
import NewMemberForm from "@/components/forms/NewMemberForm";

const Members = () => {
  return (
    <div className="h-full w-full flex flex-col justify-start items-start p-10 animate-fadeIn">
      <h1 className="text-4xl font-semibold">Members</h1>
      <AllMembers />
      <div className="my-4">
        <NewMemberForm />
      </div>
    </div>
  );
};

export default Members;
