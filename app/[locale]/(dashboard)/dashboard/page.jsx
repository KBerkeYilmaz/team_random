import { SignOutButton } from "@/components/SignOutButton";
import { getServerSession } from "next-auth";
const Dashboard = async () => {
  const session = await getServerSession();
  return (
    <div className="flex flex-col justify-center items-center w-full">
      <h1>Welcome {session.user.email}</h1>
      <SignOutButton />
    </div>
  );
};

export default Dashboard;
