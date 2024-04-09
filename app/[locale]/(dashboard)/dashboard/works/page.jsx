import NewWorkForm from "@/components/forms/NewWorkForm";
import { columns } from "./columns";
import DataTable from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";

const data = [
  {
    id: 123455,
    title: "test1",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test2",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test3",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test4",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test5",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
  {
    id: 123455,
    title: "test",
    githubUrl: "www.test.com",
    appUrl: "www.test.com",
    stack: "test",
    readme: "test",
  },
];

const Works = () => {
  return (
    <div className="h-full w-full flex flex-col justify-start items-start p-10 animate-fadeIn">
      <h1 className="text-4xl font-semibold">Works</h1>
      <Separator className="my-4" />
      <div className="my-4 w-full">
        {/* <DataTable
          columns={columns}
          data={data}
        /> */}
        <NewWorkForm />
      </div>
    </div>
  );
};

export default Works;
