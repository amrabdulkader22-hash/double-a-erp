"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

import { currencyCreateSchema, type Currency } from "@/lib/types/system-administration.types";

/**
 * DEC-057 — Form Schema Pattern (mandatory for every RHF + Zod form)
 * ------------------------------------------------------------------
 * currencyCreateSchema has fields with `.default()` / `z.coerce` (e.g.
 * decimal_places, is_base, is_active). For schemas like this, Zod's
 * INPUT type (what the form holds before submit) differs from its
 * OUTPUT type (what comes out after validation, with defaults applied
 * and values coerced).
 *
 *   FormInput  = z.input<Schema>   -> what useForm() / zodResolver expect
 *   FormOutput = z.output<Schema>  -> what onSubmit() receives (fully typed)
 *
 * Passing BOTH generics to useForm (3rd = TTransformedValues) tells
 * react-hook-form + @hookform/resolvers to type onSubmit's argument as
 * FormOutput, where decimal_places is `number` and is_base/is_active
 * are `boolean` — no `unknown`, no resolver mismatch.
 */
type CurrencyFormInput = z.input<typeof currencyCreateSchema>;
type CurrencyFormOutput = z.output<typeof currencyCreateSchema>;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(currency);

  const form = useForm<CurrencyFormInput, unknown, CurrencyFormOutput>({
    resolver: zodResolver(currencyCreateSchema),
    defaultValues: {
      currency_code: currency?.currency_code ?? "",
      name_en: currency?.name_en ?? "",
      name_ar: currency?.name_ar ?? "",
      symbol: currency?.symbol ?? "",
      decimal_places: currency?.decimal_places ?? 2,
      is_base: currency?.is_base ?? false,
      is_active: currency?.is_active ?? true,
    },
  });

  // useWatch (not form.watch()) — subscribes via a proper hook so this
  // component stays compatible with the React Compiler and avoids the
  // "react-hooks/incompatible-library" warning.
  const isBase = useWatch({ control: form.control, name: "is_base" });

  async function onSubmit(values: CurrencyFormOutput) {
    setIsSubmitting(true);
    try {
      const url = isEditMode ? `/api/currencies/${currency!.id}` : "/api/currencies";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? "Request failed");
      }

      toast.success(
        isEditMode ? "Currency updated successfully" : "Currency created successfully"
      );
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Currency code — fixed once created (used as a reference key elsewhere) */}
        <FormField
          control={form.control}
          name="currency_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Code (ISO 4217)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={3}
                  placeholder="EGP"
                  disabled={isEditMode}
                  className="uppercase"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* English name */}
        <FormField
          control={form.control}
          name="name_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name (English)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Egyptian Pound" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Arabic name */}
        <FormField
          control={form.control}
          name="name_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name (Arabic)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="الجنيه المصري" dir="rtl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Symbol (optional) */}
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as string | null) ?? ""}
                  placeholder="ج.م"
                  maxLength={8}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Decimal places (0-6, default 2) */}
        <FormField
          control={form.control}
          name="decimal_places"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Decimal Places</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={6}
                  name={field.name}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  value={(field.value as number) ?? 0}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Base currency flag */}
        <FormField
          control={form.control}
          name="is_base"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    // Business rule: the base/reporting currency must
                    // always be active. Confirm with the Owner if this
                    // should be enforced server-side too.
                    if (checked) {
                      form.setValue("is_active", true);
                    }
                  }}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Base Currency (used for company reporting)
              </FormLabel>
            </FormItem>
          )}
        />

        {/* Active flag */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  disabled={!!isBase}
                />
              </FormControl>
              <FormLabel className="font-normal">Active</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? "Save Changes" : "Create Currency"}
        </Button>
      </form>
    </Form>
  );
}
