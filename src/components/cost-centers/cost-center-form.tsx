"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  costCenterCreateSchema,
  type CostCenter,
  COST_CENTER_TYPES,
} from "@/lib/types/cost-centers.types";
import type { Company } from "@/lib/types/system-administration.types";

type FormValues = z.input<typeof costCenterCreateSchema>;

interface CostCenterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: CostCenter;
}

export function CostCenterForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CostCenterFormProps) {
  const isEditing = !!initialData;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [parentOptions, setParentOptions] = useState<CostCenter[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(costCenterCreateSchema),
    defaultValues: initialData
      ? {
          company_id: initialData.company_id,
          parent_id: initialData.parent_id,
          name_ar: initialData.name_ar,
          name_en: initialData.name_en,
          cost_center_type: initialData.cost_center_type,
          start_date: initialData.start_date,
          end_date: initialData.end_date,
          is_under_construction: initialData.is_under_construction,
          is_active: initialData.is_active,
          description_ar: initialData.description_ar,
          description_en: initialData.description_en,
        }
      : {
          company_id: "",
          parent_id: null,
          name_ar: "",
          name_en: "",
          cost_center_type: null,
          start_date: null,
          end_date: null,
          is_under_construction: true,
          is_active: true,
          description_ar: null,
          description_en: null,
        },
  });

  // Load companies on open.
  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoadingCompanies(true);
      try {
        const res = await fetch("/api/companies");
        const json = await res.json();
        if (active && json.success) setCompanies(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoadingCompanies(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  // Load potential parents whenever the selected company changes.
  const watchCompanyId = useWatch({ control: form.control, name: "company_id" });
  useEffect(() => {
    if (!watchCompanyId) return;
    let active = true;
    (async () => {
      setLoadingParents(true);
      try {
        const res = await fetch(
          `/api/cost-centers?company_id=${watchCompanyId}&is_active=true`
        );
        const json = await res.json();
        if (active && json.success) {
          const data: CostCenter[] = isEditing && initialData
            ? json.data.filter((c: CostCenter) => c.id !== initialData.id)
            : json.data;
          setParentOptions(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoadingParents(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [watchCompanyId, isEditing, initialData]);

  const watchUnderConstruction = useWatch({
    control: form.control,
    name: "is_under_construction",
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const url = isEditing ? `/api/cost-centers/${initialData!.id}` : "/api/cost-centers";
      const method = isEditing ? "PATCH" : "POST";

      const payload: Record<string, unknown> = isEditing
        ? {
            name_ar: values.name_ar,
            name_en: values.name_en,
            cost_center_type: values.cost_center_type ?? null,
            start_date: values.start_date ?? null,
            end_date: values.end_date ?? null,
            is_under_construction: values.is_under_construction,
            is_active: values.is_active,
            description_ar: values.description_ar ?? null,
            description_en: values.description_en ?? null,
          }
        : values;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Cost center ${isEditing ? "updated" : "created"} successfully.`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(json.error || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company *</FormLabel>
                <Select
                  value={field.value ?? null}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("parent_id", null);
                  }}
                  disabled={loadingCompanies || isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>
                        {(value: string) => {
                          const c = companies.find((x) => x.id === value);
                          return c ? `${c.legal_name_en} (${c.company_code})` : "Select company";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingCompanies ? (
                      <SelectItem value="__loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.legal_name_en} ({c.company_code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Cost Center</FormLabel>
                <Select
                  value={field.value ?? null}
                  onValueChange={field.onChange}
                  disabled={loadingParents || !watchCompanyId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>
                        {(value: string) => {
                          const p = parentOptions.find((x) => x.id === value);
                          return p ? `${p.cost_center_code} - ${p.name_en}` : "Select parent (optional)";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingParents ? (
                      <SelectItem value="__loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : parentOptions.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No cost centers available
                      </SelectItem>
                    ) : (
                      parentOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.cost_center_code} - {p.name_en}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English) *</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Arabic) *</FormLabel>
                <FormControl>
                  <Input dir="rtl" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cost_center_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Center Type</FormLabel>
                <Select
                  value={field.value ?? "__none"}
                  onValueChange={(v) => field.onChange(v === "__none" ? null : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {COST_CENTER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_under_construction"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Under construction</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {!watchUnderConstruction && (
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Arabic)</FormLabel>
                <FormControl>
                  <Textarea dir="rtl" {...field} value={field.value ?? ""} rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
        </div>
      </form>
    </Form>
  );
}