"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { exchangeRateCreateSchema, type ExchangeRate } from "@/lib/types/system-administration.types";
import type { Currency } from "@/lib/types/system-administration.types";

type FormValues = z.input<typeof exchangeRateCreateSchema>;

interface ExchangeRateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: ExchangeRate;
}

export function ExchangeRateForm({ open, onOpenChange, onSuccess, initialData }: ExchangeRateFormProps) {
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(exchangeRateCreateSchema),
    defaultValues: {
      currency_id: "",
      rate_date: new Date().toISOString().split("T")[0],
      rate_to_base: 1,
      source: "CBE",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        currency_id: initialData.currency_id,
        rate_date: initialData.rate_date.split("T")[0],
        rate_to_base: initialData.rate_to_base,
        source: initialData.source,
      });
    } else {
      form.reset({
        currency_id: "",
        rate_date: new Date().toISOString().split("T")[0],
        rate_to_base: 1,
        source: "CBE",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const url = initialData ? `/api/exchange-rates/${initialData.id}` : "/api/exchange-rates";
      const method = initialData ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Exchange rate ${isEditing ? "updated" : "created"} successfully.`);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(json.error || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Exchange Rate" : "Add Exchange Rate"}</DialogTitle>
          <DialogDescription>Enter the exchange rate details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingCurrencies ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
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
            <FormField
              control={form.control}
              name="rate_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rate_to_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate to Base (EGP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      {...field}
                      value={field.value?.toString() ?? ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CBE">CBE (Central Bank)</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}