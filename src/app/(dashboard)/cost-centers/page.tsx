"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, Power, Download } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";
import type { CostCenter } from "@/lib/types/cost-centers.types";
import { CostCenterForm } from "@/components/cost-centers/cost-center-form";

type CostCenterRow = CostCenter & {
  company?: {
    company_code: string;
    legal_name_ar: string;
    legal_name_en: string;
    trade_name: string;
  };
  parent?: { cost_center_code: string; name_ar: string; name_en: string };
};

const locale: "en" | "ar" = "en";

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchCostCenters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cost-centers");
      const json = await res.json();
      if (json.success) setCostCenters(json.data);
      else toast.error(json.error || "Failed to load cost centers");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  const toggleActive = useCallback(
    async (cc: CostCenterRow) => {
      try {
        const res = await fetch(`/api/cost-centers/${cc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !cc.is_active }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`Cost center ${cc.is_active ? "deactivated" : "activated"}`);
          fetchCostCenters();
        } else toast.error(json.error);
      } catch {
        toast.error("Network error");
      }
    },
    [fetchCostCenters]
  );

  const handleDelete = useCallback(
    async (cc: CostCenterRow) => {
      if (!confirm(`Delete cost center ${cc.cost_center_code}?`)) return;
      try {
        const res = await fetch(`/api/cost-centers/${cc.id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          toast.success("Cost center deleted");
          fetchCostCenters();
        } else toast.error(json.error);
      } catch {
        toast.error("Network error");
      }
    },
    [fetchCostCenters]
  );

  const exportToExcel = useCallback(() => {
    const wsData = costCenters.map((cc) => ({
      cost_center_code: cc.cost_center_code,
      name_ar: cc.name_ar,
      name_en: cc.name_en,
      cost_center_type: cc.cost_center_type || "",
      company: locale === "ar" ? cc.company?.legal_name_ar : cc.company?.legal_name_en,
      parent: locale === "ar" ? cc.parent?.name_ar : cc.parent?.name_en,
      start_date: cc.start_date || "",
      end_date: cc.end_date || "",
      is_under_construction: cc.is_under_construction ? "Yes" : "No",
      is_active: cc.is_active ? "Active" : "Inactive",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CostCenters");
    XLSX.writeFile(wb, `cost_centers_${new Date().toISOString().slice(0, 19)}.xlsx`);
  }, [costCenters]);

  const columnHelper = createColumnHelper<CostCenterRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("cost_center_code", {
        header: "Code",
        filterFn: "includesString",
      }),
      columnHelper.accessor((row) => (locale === "ar" ? row.name_ar : row.name_en), {
        id: "name",
        header: "Name",
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) => (locale === "ar" ? row.company?.legal_name_ar : row.company?.legal_name_en) || "",
        { id: "company", header: "Company", filterFn: "includesString" }
      ),
      columnHelper.accessor(
        (row) => (locale === "ar" ? row.parent?.name_ar : row.parent?.name_en) || "",
        { id: "parent", header: "Parent", filterFn: "includesString" }
      ),
      columnHelper.accessor((row) => row.cost_center_type || "", {
        id: "cost_center_type",
        header: "Type",
      }),
      columnHelper.accessor("is_under_construction", {
        header: "Under Construction",
        cell: (info) => (
          <Badge variant={info.getValue() ? "outline" : "secondary"}>
            {info.getValue() ? "Under Constr." : "Operational"}
          </Badge>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => (
          <Badge variant={info.getValue() ? "default" : "secondary"}>
            {info.getValue() ? "Active" : "Inactive"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditing(info.row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toggleActive(info.row.original)}>
              <Power className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(info.row.original)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleActive, handleDelete]
  );

  const table = useReactTable({
    data: costCenters,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Cost Centers</h1>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export to Excel
          </Button>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger
              render={<Button onClick={() => setEditing(null)}>Add Cost Center</Button>}
            />
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Cost Center" : "Add Cost Center"}</DialogTitle>
              </DialogHeader>
              <CostCenterForm
                key={editing?.id ?? "new"}
                open={formOpen}
                onOpenChange={setFormOpen}
                onSuccess={fetchCostCenters}
                initialData={editing || undefined}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanFilter() && (
                      <Input
                        placeholder="Filter..."
                        value={(header.column.getFilterValue() as string) ?? ""}
                        onChange={(e) => header.column.setFilterValue(e.target.value)}
                        className="mt-1 h-8 text-sm"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="border rounded p-1"
        >
          {[10, 20, 30, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}