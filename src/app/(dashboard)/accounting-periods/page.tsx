"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AccountingPeriod, FiscalYear } from "@/lib/types/system-administration.types";

export default function AccountingPeriodsPage() {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingYears, setLoadingYears] = useState(true);

  // جلب السنوات المالية
  useEffect(() => {
    async function fetchFiscalYears() {
      try {
        const res = await fetch("/api/fiscal-years");
        const json = await res.json();
        if (json.success) {
          setFiscalYears(json.data);
          if (json.data.length > 0) {
            const current = json.data.find((fy: FiscalYear) => fy.is_current);
            setSelectedFiscalYearId(current?.id || json.data[0].id);
          }
        } else {
          toast.error(json.error || "Failed to load fiscal years");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setLoadingYears(false);
      }
    }
    fetchFiscalYears();
  }, []);

  // جلب الفترات عند تغيير السنة المالية
  useEffect(() => {
    if (!selectedFiscalYearId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeriods([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    async function fetchPeriods() {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounting-periods?fiscal_year_id=${selectedFiscalYearId}`);
        const json = await res.json();
        if (json.success) {
          setPeriods(json.data);
        } else {
          toast.error(json.error || "Failed to load accounting periods");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchPeriods();
  }, [selectedFiscalYearId]);

  const handleFiscalYearChange = (value: string | null) => {
    setSelectedFiscalYearId(value || "");
  };

  if (loadingYears) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading fiscal years...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Accounting Periods</h1>
        <div className="w-64">
          <Select value={selectedFiscalYearId || null} onValueChange={handleFiscalYearChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              {fiscalYears.map((fy) => (
                <SelectItem key={fy.id} value={fy.id}>
                  {fy.name_en} ({fy.year_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedFiscalYearId ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Select a fiscal year to view its periods
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period #</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (AR)</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No accounting periods found. Use &quot;Generate Periods&quot; button in Fiscal Years.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.period_number}</TableCell>
                    <TableCell>{period.name_en}</TableCell>
                    <TableCell>{period.name_ar}</TableCell>
                    <TableCell>{period.start_date}</TableCell>
                    <TableCell>{period.end_date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
