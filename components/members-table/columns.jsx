"use client";
// import { ColumnDef } from "@tanstack/react-table";
import { Phone, User } from "lucide-react";

export const columns = [
  {
    accessorKey: "memberImage",
    header: () => (
      <div className="gap-2 flex items-center">
        {/* <span className=" text-opacity-60 text-indigo-500">
          <User size={18} />
        </span> */}
        <p>Image</p>
      </div>
    ),
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("memberImage") === undefined ? (
          <div className="w-20 h-20 bg-slate-900"></div>
        ) : (
          <img
            src={`${row.getValue("memberImage")}`}
            alt="Member Image"
            className="w-20 h-20"
          />
        )}
      </div>
    ),
  },
  {
    accessorKey: "memberName",
    header: () => (
      <div className="gap-2 flex items-center">
        {/* <span className=" text-opacity-60 text-indigo-500">
          <User size={18} />
        </span> */}
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
        {/* <span className=" text-opacity-60 text-indigo-500">
          <User size={18} />
        </span> */}
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
        {/* <span className=" text-opacity-60 text-indigo-500">
          <User size={18} />
        </span> */}
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
        <span className=" text-opacity-60 text-amber-400 ">
          <Phone size={18} />
        </span>
        <p>Phone</p>
      </div>
    ),
    cell: ({ row }) => {
      return <div className="text-left font-medium">{row.getValue("id")}</div>;
    },
  },
];
