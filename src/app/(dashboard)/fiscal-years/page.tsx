"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, Pencil, Trash2, RefreshCw } from "lucide-react";
import type { FiscalYear } from "@/lib/types/system-administration.types";
import { FiscalYearForm } from "@/components/fiscal-years/fiscal-year-form";

export default function FiscalYearsPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFiscalYear, setEditingFiscalYear] = useState<FiscalYear | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  async function fetchFiscalYears() {
    try {
      const res = await fetch("/api/fiscal-years");
      const json = await res.json();
      if (json.success) {
        setFiscalYears(json.data);
      } else {
        toast.error(json.error || "Failed to load fiscal years");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this fiscal year?")) return;
    try {
      const res = await fetch(`/api/fiscal-years/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Fiscal year deleted successfully");
        fetchFiscalYears();
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleGeneratePeriods(id: string) {
    setGeneratingId(id);
    try {
      const res = await fetch("/api/fiscal-years/generate-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiscal_year_id: id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Accounting periods generated successfully");
      } else {
        toast.error(json.error || "Failed to generate periods");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setGeneratingId(null);
    }
  }

  function handleEdit(fy: FiscalYear) {
    setEditingFiscalYear(fy);
    setFormOpen(true);
  }

  function handleFormSuccess() {
    fetchFiscalYears();
    setFormOpen(false);
    setEditingFiscalYear(null);
  }

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fiscal Years</h1>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger
            render={<Button onClick={() => setEditingFiscalYear(null)}>Add Fiscal Year</Button>}
          />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFiscalYear ? "Edit Fiscal Year" : "Add Fiscal Year"}</DialogTitle>
            </DialogHeader>
            <FiscalYearForm
              onOpenChange={setFormOpen}
              onSuccess={handleFormSuccess}
              initialData={editingFiscalYear || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year Code</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fiscalYears.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No fiscal years found. Click &quot;Add Fiscal Year&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              fiscalYears.map((fy) => (
                <TableRow key={fy.id}>
                  <TableCell className="font-medium">{fy.year_code}</TableCell>
                  <TableCell>{fy.name_en}</TableCell>
                  <TableCell>{fy.name_ar}</TableCell>
                  <TableCell>{fy.start_date}</TableCell>
                  <TableCell>{fy.end_date}</TableCell>
                  <TableCell>
                    {fy.is_current ? (
                      <Badge variant="default">Current</Badge>
                    ) : (
                      <Badge variant="secondary">Not Current</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={fy.status === "Open" ? "default" : "secondary"}>
                      {fy.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleGeneratePeriods(fy.id)}
                        disabled={generatingId === fy.id}
                        title="Generate Accounting Periods"
                      >
                        <RefreshCw className={`h-4 w-4 ${generatingId === fy.id ? "animate-spin" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(fy)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(fy.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}