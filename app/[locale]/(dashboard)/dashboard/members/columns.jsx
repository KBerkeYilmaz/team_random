"use client";

import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/navigation";

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "memberImage",
    header: () => (
      <div className="gap-2 flex items-center">
        <p>Image</p>
      </div>
    ),
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("memberImage") === undefined ? (
          <div className="w-12 h-12 bg-slate-900"></div>
        ) : (
          <img
            src={`${row.getValue("memberImage")}`}
            alt="Member Image"
            className="w-12 h-12"
          />
        )}
      </div>
    ),
  },
  {
    accessorKey: "memberName",
    header: () => (
      <div className="gap-2 flex items-center">
        <p>Name</p>
      </div>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("memberName")}</div>
    ),
  },
  {
    accessorKey: "memberLastName",
    header: () => (
      <div className="gap-2 flex items-center">
        <p>Last Name</p>
      </div>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("memberLastName")}</div>
    ),
  },
  {
    accessorKey: "memberTitle",
    header: () => (
      <div className="gap-2 flex items-center">
        <p>Title</p>
      </div>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("memberTitle")}</div>
    ),
  },
  {
    accessorKey: "id",
    header: () => (
      <div className="gap-2 flex items-center">
        {/* <span className=" text-opacity-60 text-amber-400 ">
          <Phone size={18} />
        </span> */}
        <p>ID</p>
      </div>
    ),
    cell: ({ row }) => {
      return <div className="text-left font-medium">{row.getValue("id")}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Link href={`/dashboard/members/${row.getValue("id")}`}>
                View member
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(row.getValue("id"))}
            >
              Copy member ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
