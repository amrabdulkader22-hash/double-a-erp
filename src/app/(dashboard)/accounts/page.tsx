"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Pencil, Trash2, Power, Download, Upload } from "lucide-react";
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
import type { Account } from "@/lib/types/accounts.types";
import { AccountForm } from "@/components/accounts/account-form";
import { ImportAccountsDialog } from "@/components/accounts/import-accounts-dialog";

type AccountRow = Account & {
  parent?: { account_code: string; name_ar: string; name_en: string };
};

// مؤقت: يمكن استبداله بـ i18n لاحقاً
const locale: "en" | "ar" = "en";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/accounts");
      const json = await res.json();
      if (json.success) setAccounts(json.data);
      else toast.error(json.error || "Failed to load accounts");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(account: AccountRow) {
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !account.is_active }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Account ${account.is_active ? "deactivated" : "activated"}`);
        fetchAccounts();
      } else toast.error(json.error);
    } catch {
      toast.error("Network error");
    }
  }

  async function handleDelete(account: AccountRow) {
    if (!confirm(`Delete account ${account.account_code}?`)) return;
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Account deleted");
        fetchAccounts();
      } else toast.error(json.error);
    } catch {
      toast.error("Network error");
    }
  }

  const exportToExcel = () => {
    const wsData = accounts.map((acc) => ({
      account_code: acc.account_code,
      name_ar: acc.name_ar,
      name_en: acc.name_en,
      account_type: acc.account_type,
      normal_balance: acc.normal_balance,
      level: acc.level,
      parent_code: acc.parent?.account_code || "",
      is_active: acc.is_active ? "Active" : "Inactive",
      description: acc.description || "",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accounts");
    XLSX.writeFile(wb, `accounts_${new Date().toISOString().slice(0, 19)}.xlsx`);
  };

  const downloadTemplate = () => {
    const template = [
      {
        account_code: "1000",
        name_ar: "أصول متداولة",
        name_en: "Current Assets",
        account_type: "Assets",
        normal_balance: "Debit",
        parent_code: "",
      },
      {
        account_code: "",
        name_ar: "صندوق",
        name_en: "Cash",
        account_type: "Assets",
        normal_balance: "Debit",
        parent_code: "1000",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "accounts_import_template.xlsx");
  };

  const columnHelper = createColumnHelper<AccountRow>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("account_code", {
        header: "Account Code",
        filterFn: "includesString",
      }),
      columnHelper.accessor((row) => (locale === "ar" ? row.name_ar : row.name_en), {
        id: "name",
        header: "Account Name",
        filterFn: "includesString",
      }),
      columnHelper.accessor((row) => row.parent?.account_code || "", {
        id: "parent_code",
        header: "Parent Code",
        filterFn: "includesString",
      }),
      columnHelper.accessor(
        (row) => (row.parent ? (locale === "ar" ? row.parent.name_ar : row.parent.name_en) : ""),
        {
          id: "parent_name",
          header: "Parent Name",
        }
      ),
      columnHelper.accessor("normal_balance", { header: "Balance" }),
      columnHelper.accessor("level", { header: "Level" }),
      columnHelper.accessor("account_type", { header: "Type" }),
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
                setEditingAccount(info.row.original);
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
    [locale]
  );

  const table = useReactTable({
    data: accounts,
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
        <h1 className="text-3xl font-bold">Chart of Accounts</h1>
        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" /> Template
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button onClick={exportToExcel} variant="outline">
            Export to Excel
          </Button>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger render={<Button>Add Account</Button>} />
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
              </DialogHeader>
              <AccountForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSuccess={fetchAccounts}
                initialData={editingAccount || undefined}
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

      <ImportAccountsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchAccounts}
      />
    </div>
  );
}