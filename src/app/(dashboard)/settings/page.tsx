"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import type { SystemParameter } from "@/lib/types/system-administration.types";

type SystemParameterRow = SystemParameter;

export default function SettingsPage() {
  const { t } = useTranslation();
  const [parameters, setParameters] = useState<SystemParameterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingParam, setEditingParam] = useState<SystemParameterRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const locale = typeof window !== "undefined" ? (localStorage.getItem("i18nextLng") || "en") : "en";

  useEffect(() => {
    fetchParameters();
  }, []);

  async function fetchParameters() {
    try {
      const res = await fetch("/api/system-parameters");
      const json = await res.json();
      if (json.success) {
        setParameters(json.data);
      } else {
        toast.error(json.error || "Failed to load parameters");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (param: SystemParameterRow) => {
    if (!param.is_editable) {
      toast.error(t("settings.notEditable") || "This parameter is read-only");
      return;
    }
    setEditingParam(param);
    setNewValue(param.param_value);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!editingParam) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/system-parameters/${editingParam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ param_value: newValue }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t("settings.updateSuccess") || "Parameter updated");
        fetchParameters();
        setFormOpen(false);
        setEditingParam(null);
      } else {
        toast.error(json.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const getDescription = (param: SystemParameterRow) => {
    if (locale === "ar" && param.description_ar) return param.description_ar;
    return param.description_en || param.param_key;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("nav.settings")}</h1>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.paramKey") || "Parameter"}</TableHead>
              <TableHead>{t("settings.description") || "Description"}</TableHead>
              <TableHead>{t("settings.paramValue") || "Value"}</TableHead>
              <TableHead>{t("settings.editable") || "Editable"}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t("settings.noParameters") || "No parameters found"}
                </TableCell>
              </TableRow>
            ) : (
              parameters.map((param) => (
                <TableRow key={param.id}>
                  <TableCell className="font-mono text-sm">{param.param_key}</TableCell>
                  <TableCell>{getDescription(param)}</TableCell>
                  <TableCell>{param.param_value}</TableCell>
                  <TableCell>
                    {param.is_editable ? (
                      <span className="text-green-600 dark:text-green-400">Yes</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(param)}
                      disabled={!param.is_editable}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.editParameter") || "Edit Parameter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">
                {t("settings.paramKey") || "Parameter"}
              </label>
              <div className="mt-1 p-2 bg-muted rounded-md font-mono text-sm">
                {editingParam?.param_key}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("settings.paramValue") || "Value"}
              </label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}