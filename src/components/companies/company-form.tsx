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
  companyCreateSchema,
  type Company,
} from "@/lib/types/system-administration.types";
import type { Currency } from "@/lib/types/system-administration.types";

type FormValues = z.input<typeof companyCreateSchema>;

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Company;
}

export function CompanyForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CompanyFormProps) {
  const isEditing = !!initialData;

  const form = useForm<FormValues, unknown, z.output<typeof companyCreateSchema>>({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: {
      company_code: "",
      legal_name_ar: "",
      legal_name_en: "",
      trade_name: "",
      commercial_registration_no: "",
      tax_registration_no: "",
      address: "",
      phone: "",
      email: "",
      logo_url: "",
      base_currency_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        company_code: initialData.company_code,
        legal_name_ar: initialData.legal_name_ar,
        legal_name_en: initialData.legal_name_en,
        trade_name: initialData.trade_name,
        commercial_registration_no: initialData.commercial_registration_no,
        tax_registration_no: initialData.tax_registration_no,
        address: initialData.address,
        phone: initialData.phone,
        email: initialData.email,
        logo_url: initialData.logo_url,
        base_currency_id: initialData.base_currency_id,
        is_active: initialData.is_active,
      });
    } else {
      form.reset({
        company_code: "",
        legal_name_ar: "",
        legal_name_en: "",
        trade_name: "",
        commercial_registration_no: "",
        tax_registration_no: "",
        address: "",
        phone: "",
        email: "",
        logo_url: "",
        base_currency_id: "",
        is_active: true,
      });
    }
  }, [initialData, form]);

  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await fetch("/api/currencies");
        const json = await res.json();
        if (json.success) setCurrencies(json.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    if (open) fetchCurrencies();
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    try {
      const url = initialData ? `/api/companies/${initialData.id}` : "/api/companies";
      const method = initialData ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Company ${isEditing ? "updated" : "created"} successfully.`);
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
            name="company_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., DOUB001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="base_currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Currency *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingCurrencies}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingCurrencies ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      currencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.currency_code} - {c.name_en}
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
            name="legal_name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Name (English) *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="legal_name_ar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Name (Arabic) *</FormLabel>
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
          name="trade_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trade Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="commercial_registration_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commercial Registration No. *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tax_registration_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Registration No. *</FormLabel>
                <FormControl>
                  <Input {...field} />
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
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} value={field.value ?? ""} />
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