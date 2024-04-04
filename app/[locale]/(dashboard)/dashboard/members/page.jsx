import NewMemberForm from "@/components/forms/NewMemberForm";

const Members = () => {
  return (
    <div className="h-full w-full flex flex-col justify-start items-start p-10">
      <h1 className="text-4xl">Members</h1>
      <div className="my-4">
        <NewMemberForm />
      </div>
    </div>
  );
};

export default Members;
