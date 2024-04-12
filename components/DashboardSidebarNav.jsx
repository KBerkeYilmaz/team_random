"use client";

import { Link, usePathname } from "@/navigation";
import { Home, Package, ShoppingCart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/SignOutButton";

export default function DashboardSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 text-sm font-medium  gap-2">
      <Link
        href="/dashboard"
        className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
          pathname === "/dashboard" && "bg-muted"
        } `}
      >
        <Home className="h-5 w-5" />
        Dashboard
      </Link>
      <Link
        href="/dashboard/messages"
        className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
          pathname.includes("/dashboard/messages") && "bg-muted"
        } `}
      >
        <ShoppingCart className="h-5 w-5" />
        Messages
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          6
        </Badge>
      </Link>
      <Link
        href="/dashboard/members"
        className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
          pathname.includes("/dashboard/members") && "bg-muted"
        } `}
      >
        <Package className="h-5 w-5" />
        Members
      </Link>
      <Link
        href="/dashboard/works"
        className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
          pathname.includes("/dashboard/works") && "bg-muted"
        } `}
      >
        <Users className="h-5 w-5" />
        Works
      </Link>
      <SignOutButton />
    </nav>
  );
}
