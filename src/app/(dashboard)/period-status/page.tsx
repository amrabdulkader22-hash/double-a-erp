"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { Loader2, Lock, Unlock } from "lucide-react";
import type { Company, FiscalYear, AccountingPeriod, PeriodStatus } from "@/lib/types/system-administration.types";

type PeriodWithStatus = AccountingPeriod & {
  status?: PeriodStatus;
  company_period_status_id?: string;
};

export default function PeriodStatusPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [periods, setPeriods] = useState<PeriodWithStatus[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // جلب الشركات
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies");
        const json = await res.json();
        if (json.success) setCompanies(json.data);
        else toast.error("Failed to load companies");
      } catch {
        toast.error("Network error");
      } finally {
        setLoadingCompanies(false);
      }
    }
    fetchCompanies();
  }, []);

  // جلب السنوات المالية
  useEffect(() => {
    async function fetchFiscalYears() {
      try {
        const res = await fetch("/api/fiscal-years");
        const json = await res.json();
        if (json.success) setFiscalYears(json.data);
        else toast.error("Failed to load fiscal years");
      } catch {
        toast.error("Network error");
      } finally {
        setLoadingYears(false);
      }
    }
    fetchFiscalYears();
  }, []);

  // جلب الفترات المحاسبية وحالتها للشركة المختارة
  useEffect(() => {
    if (!selectedCompanyId || !selectedFiscalYearId) {
      setPeriods([]);
      return;
    }

    async function fetchPeriodsAndStatus() {
      setLoadingPeriods(true);
      try {
        // 1. جلب الفترات المحاسبية للسنة المالية
        const periodsRes = await fetch(`/api/accounting-periods?fiscal_year_id=${selectedFiscalYearId}`);
        const periodsJson = await periodsRes.json();
        if (!periodsJson.success) throw new Error(periodsJson.error);
        const allPeriods = periodsJson.data as AccountingPeriod[];

        // 2. جلب حالة هذه الفترات للشركة المختارة
        const statusRes = await fetch(`/api/company-period-status?company_id=${selectedCompanyId}&fiscal_year_id=${selectedFiscalYearId}`);
        const statusJson = await statusRes.json();
        let statusMap = new Map<string, { status: PeriodStatus; id: string }>();
        if (statusJson.success) {
          statusJson.data.forEach((item: any) => {
            statusMap.set(item.accounting_period_id, { status: item.status, id: item.id });
          });
        }

        // 3. دمج البيانات
        const merged = allPeriods.map(period => ({
          ...period,
          status: statusMap.get(period.id)?.status,
          company_period_status_id: statusMap.get(period.id)?.id,
        }));
        setPeriods(merged);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load periods");
      } finally {
        setLoadingPeriods(false);
      }
    }

    fetchPeriodsAndStatus();
  }, [selectedCompanyId, selectedFiscalYearId]);

  const togglePeriodStatus = async (period: PeriodWithStatus) => {
    const newStatus = period.status === "Open" ? "Closed" : "Open";
    setTogglingId(period.id);
    try {
      const url = period.company_period_status_id
        ? `/api/company-period-status/${period.company_period_status_id}`
        : `/api/company-period-status`;
      const method = period.company_period_status_id ? "PATCH" : "POST";
      const body = {
        company_id: selectedCompanyId,
        accounting_period_id: period.id,
        status: newStatus,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Period ${period.name_en} is now ${newStatus}`);
        // تحديث الحالة محلياً
        setPeriods(prev =>
          prev.map(p =>
            p.id === period.id
              ? {
                  ...p,
                  status: newStatus,
                  company_period_status_id: json.data?.id || period.company_period_status_id,
                }
              : p
          )
        );
      } else {
        toast.error(json.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleCompanyChange = (value: string | null) => setSelectedCompanyId(value || "");
  const handleFiscalYearChange = (value: string | null) => setSelectedFiscalYearId(value || "");

  if (loadingCompanies || loadingYears) {
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
        <h1 className="text-3xl font-bold">Period Status (Open/Close)</h1>
      </div>

      {/* Dropdowns للشركة والسنة المالية */}
      <div className="flex gap-4 flex-wrap">
        <div className="w-64">
          <Select value={selectedCompanyId || null} onValueChange={handleCompanyChange}>
            <SelectTrigger>
              <SelectValue>
                {(value: string) => {
                  const c = companies.find(x => x.id === value);
                  return c ? `${c.legal_name_en} (${c.company_code})` : "Select company";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.legal_name_en} ({c.company_code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-64">
          <Select value={selectedFiscalYearId || null} onValueChange={handleFiscalYearChange}>
            <SelectTrigger>
              <SelectValue>
                {(value: string) => {
                  const fy = fiscalYears.find(x => x.id === value);
                  return fy ? `${fy.name_en} (${fy.year_code})` : "Select fiscal year";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {fiscalYears.map(fy => (
                <SelectItem key={fy.id} value={fy.id}>{fy.name_en} ({fy.year_code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* جدول الفترات */}
      {selectedCompanyId && selectedFiscalYearId && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period #</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (AR)</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingPeriods ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Loading...
                  </TableCell>
                </TableRow>
              ) : periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No periods found.</TableCell>
                </TableRow>
              ) : (
                periods.map(period => (
                  <TableRow key={period.id}>
                    <TableCell>{period.period_number}</TableCell>
                    <TableCell>{period.name_en}</TableCell>
                    <TableCell>{period.name_ar}</TableCell>
                    <TableCell>{period.start_date}</TableCell>
                    <TableCell>{period.end_date}</TableCell>
                    <TableCell>
                      <Badge variant={period.status === "Open" ? "default" : "secondary"}>
                        {period.status || "Closed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePeriodStatus(period)}
                        disabled={togglingId === period.id}
                      >
                        {togglingId === period.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : period.status === "Open" ? (
                          <>
                            <Lock className="h-4 w-4 mr-1" /> Close
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-1" /> Open
                          </>
                        )}
                      </Button>
                    </TableCell>
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