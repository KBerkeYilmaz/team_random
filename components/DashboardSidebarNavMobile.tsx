"use client";
import { Link, usePathname } from "@/navigation";
import { Home, Package, Package2, Inbox, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/SignOutButton";
import { SheetClose } from "./ui/sheet";
import { Separator } from "./ui/separator";

export default function DashboardSidebarNavMobile({
  unReadMailsCount,
}: {
  unReadMailsCount: number | null;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-full flex-col justify-between px-2 py-4 text-sm font-medium">
      <div className="flex w-full flex-col gap-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package2 className="m-2 h-6 w-6" />
          <span className="sr-only">Acme Inc</span>
        </Link>
        <Separator />
        <SheetClose asChild>
          <Link
            href="/dashboard"
            className={` flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
              pathname === "/dashboard" && "bg-muted"
            } `}
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link
            href="/dashboard/inbox"
            className={` flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
              pathname.includes("/dashboard/inbox") && "bg-muted"
            } `}
          >
            <Inbox className="h-5 w-5" />
            Inbox
            <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              {unReadMailsCount}
            </Badge>
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link
            href="/dashboard/members"
            className={` flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
              pathname.includes("/dashboard/members") && "bg-muted"
            } `}
          >
            <Users className="h-5 w-5" />
            Members
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link
            href="/dashboard/works"
            className={` flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
              pathname.includes("/dashboard/works") && "bg-muted"
            } `}
          >
            <Package className="h-5 w-5" />
            Works
          </Link>
        </SheetClose>
      </div>
      <div className="w-full">
        <SignOutButton />
      </div>
    </nav>
  );
}
