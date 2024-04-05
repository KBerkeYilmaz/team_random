import { getServerSession } from "next-auth";

const Dashboard = async () => {
  const session = await getServerSession();
  return (
    <div className="flex flex-col justify-center items-center w-full pt-[72px] animate-fadeIn">
      <h1>Welcome {session.user.email}</h1>
    </div>
  );
};

export default Dashboard;
