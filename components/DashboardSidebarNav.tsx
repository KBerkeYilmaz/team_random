"use client";
import React, { useEffect, useState } from "react";
import { Link, usePathname } from "@/navigation";
import { Home, Package, Inbox, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/SignOutButton";

export default function DashboardSidebarNav({
  unReadMailsCount,
}: {
  unReadMailsCount: number | null;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-full flex-col justify-between px-2 py-4 text-sm font-medium">
      <div className="flex w-full flex-col   gap-2">
        <Link
          href="/dashboard"
          className={` flex w-full items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
            pathname === "/dashboard" && "bg-muted"
          } `}
        >
          <Home className="h-5 w-5" />
          Dashboard
        </Link>
        <Link
          href="/dashboard/inbox"
          className={` flex w-full items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
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
          className={` flex w-full items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
            pathname.includes("/dashboard/members") && "bg-muted"
          } `}
        >
          <Users className="h-5 w-5" />
          Members
        </Link>
        <Link
          href="/dashboard/works"
          className={` flex w-full items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground ${
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
