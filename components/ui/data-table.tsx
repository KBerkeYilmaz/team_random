"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NewMemberForm from "../forms/NewMemberForm";
import NewWorkForm from "../forms/NewWorkForm";
import { useEffect } from "react";
import { useRouter } from "@/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterAnchor: string;
  tag: string;
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  filterAnchor,
  tag,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [screenWidth, setScreenWidth] = React.useState<number | "">("");
  const router = useRouter();
  const columnName = tag + filterAnchor;
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      columnVisibility: { id: false },
      pagination: {
        pageSize: 5,
        pageIndex: 0,
      },
    },
  });

  const columIds = columns.map((column) => {
    if ("accessorKey" in column) {
      return column.accessorKey;
    }
    return column.id;
  });

  const handleResize = () => {
    setScreenWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    if (window.innerWidth < 900) {
      const allowed = columIds
        .slice(4, columIds.length)
        .reduce<Record<string, boolean>>((acc, curr) => {
          acc[curr as string] = false;
          return acc;
        }, {});
      setColumnVisibility({ select: false, ...allowed });
    } else {
      setColumnVisibility({ id: false });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [screenWidth]);

  return (
    <>
      <div className="flex w-full items-center py-4">
        <div className="flex w-full flex-col  justify-between gap-4 pr-2 md:flex-row">
          <Input
            placeholder={`Filter ${filterAnchor}...`}
            value={
              (table.getColumn(columnName)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(columnName)?.setFilterValue(event.target.value)
            }
          />
          {filterAnchor === "Title" ? <NewWorkForm /> : <NewMemberForm />}
        </div>
        <div className="flex h-full items-end md:items-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto hidden sm:block">
                Columns
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  if (column.id !== "id") {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  }
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="w-full rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  if (header.id !== "id") {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  }
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() =>
                    router.push(`/dashboard/${tag}s/${row.getValue("id")}`)
                  }
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    console.log();
                    if (
                      cell.id.slice(cell.id.length - 2, cell.id.length) !== "id"
                    ) {
                      return (
                        <TableCell
                          className={`${cell.id.slice(cell.id.length - 3, cell.id.length) === "URL" ? " break-all" : ""}`}
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    }
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
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
      <div className="flex w-full items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </>
  );
}
