"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { AccountType, NormalBalance } from "@/lib/types/accounts.types";

interface ImportRow {
  rowIndex: number;
  account_code?: string;
  name_ar: string;
  name_en: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent_code?: string;
  valid: boolean;
  errors: string[];
  data: Record<string, unknown>;
}

interface ImportAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportAccountsDialog({ open, onOpenChange, onSuccess }: ImportAccountsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const validateRow = async (
    row: Record<string, unknown>,
    index: number,
    existingCodes: Map<string, boolean>,
    parentMap: Map<string, string>
  ): Promise<ImportRow> => {
    const errors: string[] = [];
    const account_code = row.account_code?.toString().trim();
    const name_ar = row.name_ar?.toString().trim();
    const name_en = row.name_en?.toString().trim();
    const account_type = row.account_type?.toString().trim();
    const normal_balance = row.normal_balance?.toString().trim();
    const parent_code = row.parent_code?.toString().trim();

    if (!name_ar) errors.push("Arabic name required");
    if (!name_en) errors.push("English name required");
    if (!account_type || !["Assets","Liabilities","Equity","Revenue","Expenses","CostOfSales"].includes(account_type))
      errors.push("Invalid account type");
    if (!normal_balance || !["Debit","Credit"].includes(normal_balance))
      errors.push("Invalid normal balance");

    let parentId: string | null = null;
    if (parent_code) {
      parentId = parentMap.get(parent_code) || null;
      if (!parentId) errors.push(`Parent code "${parent_code}" not found`);
    }

    if (account_code) {
      if (existingCodes.has(account_code)) errors.push(`Duplicate account code "${account_code}"`);
      else existingCodes.set(account_code, true);
    } else if (!parent_code) {
      errors.push("Account code required for root accounts");
    }

    return {
      rowIndex: index,
      account_code,
      name_ar: name_ar || "",
      name_en: name_en || "",
      account_type: account_type as AccountType,
      normal_balance: normal_balance as NormalBalance,
      parent_code,
      valid: errors.length === 0,
      errors,
      data: { ...row, parent_id: parentId },
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

    // جلب جميع الحسابات الموجودة مسبقاً للتحقق من الآباء
    const res = await fetch("/api/accounts?is_deleted=false");
    const json = await res.json();
    const existingAccounts = json.success ? json.data : [];
    const parentMap = new Map<string, string>();
    existingAccounts.forEach((acc: { account_code: string; id: string }) => parentMap.set(acc.account_code, acc.id));

    const existingCodes = new Map<string, boolean>();
    const validated: ImportRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const validatedRow = await validateRow(rows[i], i, existingCodes, parentMap);
      validated.push(validatedRow);
    }
    setPreview(validated);
    setStep("preview");
  };

  const handleImport = async () => {
    const validRows = preview.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }
    setImporting(true);
    let inserted = 0;
    let failed = 0;
    for (const row of validRows) {
      try {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name_ar: row.name_ar,
            name_en: row.name_en,
            account_type: row.account_type,
            normal_balance: row.normal_balance,
            account_code: row.account_code || undefined,
            parent_id: row.data.parent_id || undefined,
            is_active: true,
          }),
        });
        const json = await res.json();
        if (json.success) inserted++;
        else failed++;
      } catch {
        failed++;
      }
    }
    toast.success(`Import completed: ${inserted} inserted, ${failed} failed`);
    onOpenChange(false);
    setStep("upload");
    setFile(null);
    setPreview([]);
    onSuccess();
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Accounts from Excel</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Select Excel file (.xlsx, .xls)</label>
              <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="mt-1" />
            </div>
            <Button onClick={handlePreview} disabled={!file}>
              Preview
            </Button>
          </div>
        )}

        {step === "preview" && (
          <>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Name (AR)</TableHead>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Parent Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row) => (
                    <TableRow key={row.rowIndex}>
                      <TableCell>{row.rowIndex + 1}</TableCell>
                      <TableCell>{row.account_code || "-"}</TableCell>
                      <TableCell>{row.name_ar}</TableCell>
                      <TableCell>{row.name_en}</TableCell>
                      <TableCell>{row.account_type}</TableCell>
                      <TableCell>{row.normal_balance}</TableCell>
                      <TableCell>{row.parent_code || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={row.valid ? "default" : "destructive"}>
                          {row.valid ? "OK" : "Error"}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.errors.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import Valid Rows"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}