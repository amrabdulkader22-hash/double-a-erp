"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const currencySchema = z.object({
  currency_code: z.string().length(3, "Must be 3 characters").toUpperCase(),
  name_en: z.string().min(1, "Required").max(120),
  name_ar: z.string().min(1, "Required").max(120),
  symbol: z.string().max(8).optional(),
  decimal_places: z.coerce.number().int().min(0).max(6).default(2),
  is_base: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type CurrencyFormData = z.infer<typeof currencySchema>;

interface CurrencyFormProps {
  currency?: {
    id: string;
    currency_code: string;
    name_en: string;
    name_ar: string;
    symbol: string | null;
    decimal_places: number;
    is_base: boolean;
    is_active: boolean;
  } | null;
  onSuccess: () => void;
}

export function CurrencyForm({ currency, onSuccess }: CurrencyFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      currency_code: currency?.currency_code || "",
      name_en: currency?.name_en || "",
      name_ar: currency?.name_ar || "",
      symbol: currency?.symbol || "",
      decimal_places: currency?.decimal_places || 2,
      is_base: currency?.is_base || false,
      is_active: currency?.is_active ?? true,
    },
  });

  async function onSubmit(data: CurrencyFormData) {
    setLoading(true);
    try {
      const url = currency ? `/api/currencies/${currency.id}` : "/api/currencies";
      const method = currency ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save currency");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving currency:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currency_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Code (ISO 4217)</FormLabel>
              <FormControl>
                <Input placeholder="EGP" maxLength={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name (English)</FormLabel>
              <FormControl>
                <Input placeholder="Egyptian Pound" {...field} />
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
              <FormLabel>Name (Arabic)</FormLabel>
              <FormControl>
                <Input placeholder="جنيه مصري" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input placeholder="£" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="decimal_places"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decimal Places</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-6">
          <FormField
            control={form.control}
            name="is_base"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Base Currency</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0">Active</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {currency ? "Update Currency" : "Add Currency"}
        </Button>
      </form>
    </Form>
  );
}
