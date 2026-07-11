import { getMemberCount } from "@/actions/memberAction";
import { getWorkCount } from "@/actions/workAction";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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
  // AUDIT #87 (Phase 1): session now from Better Auth (auth.api.getSession).
  // The dashboard layout already enforces admin; this read is for the greeting.
  const session = await auth.api.getSession({ headers: await headers() });
  const memberCount = await getMemberCount();
  const workCount = await getWorkCount();

  return (
    <div className="flex w-full animate-fadeIn flex-col justify-center p-10">
      <h1 className="mb-4 text-center text-4xl font-semibold md:text-start">
        Dashboard
      </h1>
      <Separator />
      <div className="w-full px-2 py-10 text-xl">
        <h2>Welcome, {session?.user?.name}</h2>
      </div>
      <Separator />

      <div className="grid max-w-5xl gap-4 py-10 sm:grid-cols-2">
        <Card className="flex flex-col items-center justify-center shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Total Works</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <h3 className="text-5xl font-bold">
              <CounterNumber
                num={typeof workCount === "number" ? workCount : 0}
              />
            </h3>
          </CardContent>
          <CardFooter className="text-center">
            <Link
              className="text-lg transition-all duration-300 hover:text-primary/80"
              href={"/dashboard/works"}
            >
              See All
            </Link>
          </CardFooter>
        </Card>
        <Card className="flex flex-col items-center justify-center shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Total Members</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <h3 className="text-5xl font-bold">
              <CounterNumber
                num={typeof memberCount === "number" ? memberCount : 0}
              />
            </h3>
          </CardContent>
          <CardFooter className="text-center">
            <Link
              className="text-lg transition-all duration-300 hover:text-primary/80"
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
