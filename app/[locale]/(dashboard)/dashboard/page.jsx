import { getMemberCount } from "@/actions/memberAction";
import { getWorkCount } from "@/actions/workAction";
import { Separator } from "@/components/ui/separator";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "@/navigation";
import CounterNumber from "@/components/CounterNumber";

const Dashboard = async () => {
  const session = await getServerSession();
  const memberCount = await getMemberCount();
  const workCount = await getWorkCount();

  return (
    <div className="flex flex-col justify-center w-full p-10 animate-fadeIn">
      <h1 className="text-4xl mb-4 font-semibold">Dashboard</h1>
      <Separator />
      <div className="py-10 text-xl w-full px-2">
        <h2>Welcome, {session.user.name}</h2>
      </div>
      <Separator />

      <div className="grid grid-cols-2 gap-4 py-10 max-w-5xl">
        <Card className="flex flex-col justify-center items-center shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Total Works</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <h3 className="text-5xl font-bold">
              {" "}
              <CounterNumber num={workCount} />
            </h3>
          </CardContent>
          <CardFooter className="text-center">
            <Link
              className="text-lg hover:text-primary/80 transition-all duration-300"
              href={"/dashboard/works"}
            >
              See All
            </Link>
          </CardFooter>
        </Card>
        <Card className="flex flex-col justify-center items-center shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Total Members</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <h3 className="text-5xl font-bold">
              <CounterNumber num={memberCount} />
            </h3>
          </CardContent>
          <CardFooter className="text-center">
            <Link
              className="text-lg hover:text-primary/80 transition-all duration-300"
              href={"/dashboard/members"}
            >
              See All
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
