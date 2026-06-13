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
import type { Branch } from "@/lib/types/system-administration.types";
import { BranchForm } from "@/components/branches/branch-form";

type BranchRow = Branch & { companies?: { legal_name_en: string; company_code: string } };

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  async function fetchBranches() {
    try {
      const res = await fetch("/api/branches");
      const json = await res.json();
      if (json.success) {
        setBranches(json.data);
      } else {
        toast.error(json.error || "Failed to load branches");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Branch deleted successfully");
        fetchBranches();
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  }

  function handleEdit(branch: Branch) {
    setEditingBranch(branch);
    setFormOpen(true);
  }

  function handleFormSuccess() {
    fetchBranches();
    setFormOpen(false);
    setEditingBranch(null);
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
        <h1 className="text-3xl font-bold">Branches</h1>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger
            render={<Button onClick={() => setEditingBranch(null)}>Add Branch</Button>}
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Branch" : "Add Branch"}</DialogTitle>
            </DialogHeader>
            <BranchForm
              open={formOpen}
              onOpenChange={setFormOpen}
              onSuccess={handleFormSuccess}
              initialData={editingBranch || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Code</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Parent Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No branches found. Click &quot;Add Branch&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.branch_code}</TableCell>
                  <TableCell>{branch.name_en}</TableCell>
                  <TableCell>{branch.companies?.legal_name_en || branch.company_id}</TableCell>
                  <TableCell>
                    <Badge variant={branch.is_active ? "default" : "secondary"}>
                      {branch.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)}>
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