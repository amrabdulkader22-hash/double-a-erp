"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import {
  branchCreateSchema,
  type Branch,
} from "@/lib/types/system-administration.types";
import type { Company } from "@/lib/types/system-administration.types";

type FormValues = z.input<typeof branchCreateSchema>;

interface BranchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Branch;
}

export function BranchForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: BranchFormProps) {
  const isEditing = !!initialData;

  const form = useForm<FormValues, unknown, z.output<typeof branchCreateSchema>>({
    resolver: zodResolver(branchCreateSchema),
    defaultValues: {
      company_id: "",
      branch_code: "",
      name_ar: "",
      name_en: "",
      address: "",
      phone: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        company_id: initialData.company_id,
        branch_code: initialData.branch_code,
        name_ar: initialData.name_ar,
        name_en: initialData.name_en,
        address: initialData.address ?? "",
        phone: initialData.phone ?? "",
        is_active: initialData.is_active,
      });
    } else {
      form.reset({
        company_id: "",
        branch_code: "",
        name_ar: "",
        name_en: "",
        address: "",
        phone: "",
        is_active: true,
      });
    }
  }, [initialData, form]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/companies");
        const json = await res.json();
        if (json.success) setCompanies(json.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCompanies(false);
      }
    };
    if (open) fetchCompanies();
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const url = initialData ? `/api/branches/${initialData.id}` : "/api/branches";
      const method = initialData ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Branch ${isEditing ? "updated" : "created"} successfully.`);
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
                <Select onValueChange={field.onChange} value={field.value} disabled={loadingCompanies}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingCompanies ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
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
            name="branch_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., CAI001" {...field} />
                </FormControl>
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
                  <Input {...field} />
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
                  <Input dir="rtl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Active</FormLabel>
              </div>
            </FormItem>
          )}
        />

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