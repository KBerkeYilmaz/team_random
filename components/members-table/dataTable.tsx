"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useRouter } from "@/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
  });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 1, pageIndex: 0 } },
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
      columnFilters,
    },
  });
  const router = useRouter();
  return (
    <>
      <div className="rounded-md border">
        {/* @ts-ignore */}
        <Table>
          {/* @ts-ignore */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              //@ts-ignore
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    //@ts-ignore
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          {/* @ts-ignore */}
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                //@ts-ignore
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() =>
                    //@ts-ignore
                    router.push(`/dashboard/members/${row.getValue("id")}`)
                  }
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    //@ts-ignore
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              //@ts-ignore
              <TableRow>
                {/* @ts-ignore */}
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data.length > 1 && (
        <div className="flex justify-between gap-1">
          <div className="flex items-center pb-2">
            {/* @ts-ignore */}
            <Input
              //@ts-ignore
              placeholder="Filter Names..."
              value={
                (table.getColumn("memberName")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event: any) =>
                table
                  .getColumn("memberName")
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm "
            />
          </div>
          <div className="flex items-center justify-end space-x-2 pb-2">
            {/* @ts-ignore */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </Button>
            {/* @ts-ignore */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
