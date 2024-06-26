import { ModeToggle } from "@/components/ModeToggle";
import { Bell, Menu, Package2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AccountMenu from "./AccountMenu";
import { Link } from "@/navigation";
import DashboardSidebarNav from "./DashboardSidebarNav";
import DashboardSidebarNavMobile from "./DashboardSidebarNavMobile";
import { fetchUnseen } from "@/actions/emailAction";

const DashboardSidebar = async ({ children }) => {
  const unReadMails = await fetchUnseen();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 dark:bg-background md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex items-center border-b px-4 h-[65px] lg:px-6">
            <Link href="/">
              {/* <Image
              src={"/images/logos/logodef.png"}
              width={100}
              height={50}
              alt="logo"
              className="absolute -bottom-14 -left-6 lg:left-0"
              priority="true"
            /> */}
              {/* <h2 className="text-3xl text-center dark:bg-white rounded-lg dark:text-black text-white bg-blue-500">
              {"<?/>"}
            </h2> */}
              {/* <span className="absolute -bottom-4 left-20 hidden text-base font-bold tracking-wider lg:block">
              TEAM RANDOM
            </span> */}
              <span className="font-bold text-sm hidden md:block">
                TEAM RANDOM
              </span>
            </Link>
            {/* <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button> */}
          </div>
          <DashboardSidebarNav unReadMailsCount={unReadMails} />
        </div>
      </div>

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 dark:bg-background lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col pt-10">
              <DashboardSidebarNavMobile unReadMailsCount={unReadMails} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1"></div>
          <ModeToggle />
          <AccountMenu />
        </header>
        {children}
      </div>
    </div>
  );
};

export default DashboardSidebar;
