"use client";

import { useEffect } from "react";
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
import { toast } from "sonner";
import {
  fiscalYearCreateSchema,
  type FiscalYear,
} from "@/lib/types/system-administration.types";

type FormValues = z.input<typeof fiscalYearCreateSchema>;

interface FiscalYearFormProps {
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: FiscalYear;
}

export function FiscalYearForm({
  onOpenChange,
  onSuccess,
  initialData,
}: FiscalYearFormProps) {
  const isEditing = !!initialData;

  const form = useForm<FormValues, unknown, z.output<typeof fiscalYearCreateSchema>>({
    resolver: zodResolver(fiscalYearCreateSchema),
    defaultValues: {
      year_code: "",
      name_ar: "",
      name_en: "",
      start_date: "",
      end_date: "",
      is_current: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        year_code: initialData.year_code,
        name_ar: initialData.name_ar,
        name_en: initialData.name_en,
        start_date: initialData.start_date,
        end_date: initialData.end_date,
        is_current: initialData.is_current,
      });
    } else {
      form.reset({
        year_code: "",
        name_ar: "",
        name_en: "",
        start_date: "",
        end_date: "",
        is_current: false,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const url = initialData ? `/api/fiscal-years/${initialData.id}` : "/api/fiscal-years";
      const method = initialData ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Fiscal year ${isEditing ? "updated" : "created"} successfully.`);
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
            name="year_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., FY2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_current"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Current Fiscal Year</FormLabel>
                </div>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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