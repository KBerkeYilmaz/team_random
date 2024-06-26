"use client";
import React, { useEffect, useState } from "react";
import { Link, usePathname } from "@/navigation";
import { Home, Package, Inbox, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/SignOutButton";

export default function DashboardSidebarNav({ unReadMailsCount }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full px-2 text-sm font-medium w-full justify-between py-4">
      <div className="w-full flex flex-col   gap-2">
        <Link
          href="/dashboard"
          className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground w-full ${
            pathname === "/dashboard" && "bg-muted"
          } `}
        >
          <Home className="h-5 w-5" />
          Dashboard
        </Link>
        <Link
          href="/dashboard/inbox"
          className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground w-full ${
            pathname.includes("/dashboard/inbox") && "bg-muted"
          } `}
        >
          <Inbox className="h-5 w-5" />
          Inbox
          <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
            {unReadMailsCount}
          </Badge>
        </Link>
        <Link
          href="/dashboard/members"
          className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground w-full ${
            pathname.includes("/dashboard/members") && "bg-muted"
          } `}
        >
          <Users className="h-5 w-5" />
          Members
        </Link>
        <Link
          href="/dashboard/works"
          className={` transition-all ease-in-out duration-200 flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground w-full ${
            pathname.includes("/dashboard/works") && "bg-muted"
          } `}
        >
          <Package className="h-5 w-5" />
          Works
        </Link>
      </div>
      <div className="w-full">
        <SignOutButton />
      </div>
    </nav>
  );
}
