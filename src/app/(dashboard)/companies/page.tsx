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
import { Loader2, Pencil, Trash2 } from "lucide-react";
import type { Company } from "@/lib/types/system-administration.types";
import { CompanyForm } from "@/components/companies/company-form";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const res = await fetch("/api/companies");
      const json = await res.json();
      if (json.success) {
        setCompanies(json.data);
      } else {
        toast.error(json.error || "Failed to load companies");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this company?")) return;
    try {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Company deleted successfully");
        fetchCompanies();
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  }

  function handleEdit(company: Company) {
    setEditingCompany(company);
    setFormOpen(true);
  }

  function handleFormSuccess() {
    fetchCompanies();
    setFormOpen(false);
    setEditingCompany(null);
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
        <h1 className="text-3xl font-bold">Companies</h1>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger
            render={
              <Button onClick={() => setEditingCompany(null)}>
                Add Company
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "Edit Company" : "Add Company"}
              </DialogTitle>
            </DialogHeader>
            <CompanyForm
              open={formOpen}
              onOpenChange={setFormOpen}
              onSuccess={handleFormSuccess}
              initialData={editingCompany || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Code</TableHead>
              <TableHead>Legal Name (EN)</TableHead>
              <TableHead>Trade Name</TableHead>
              <TableHead>Tax Reg No.</TableHead>
              <TableHead>Base Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No companies found. Click &quot;Add Company&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.company_code}</TableCell>
                  <TableCell>{company.legal_name_en}</TableCell>
                  <TableCell>{company.trade_name}</TableCell>
                  <TableCell>{company.tax_registration_no}</TableCell>
                  <TableCell>{company.base_currency_id}</TableCell>
                  <TableCell>
                    <Badge variant={company.is_active ? "default" : "secondary"}>
                      {company.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(company)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company.id)}
                      >
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