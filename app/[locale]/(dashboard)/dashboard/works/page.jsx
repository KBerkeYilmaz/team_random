import NewWorkForm from "@/components/forms/NewWorkForm";

const Works = () => {
  return (
    <div className="h-full w-full flex flex-col justify-start items-start p-10 animate-fadeIn">
      <h1 className="text-4xl font-semibold">Works</h1>
      <div className="my-4">
        <NewWorkForm />
      </div>
    </div>
  );
};

export default Works;
