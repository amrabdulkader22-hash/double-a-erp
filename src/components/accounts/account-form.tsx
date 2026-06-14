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
  accountCreateSchema,
  type Account,
  ACCOUNT_TYPES,
  getDefaultNormalBalance,
  type AccountType,
} from "@/lib/types/accounts.types";

// Single form type — based on the CREATE schema (it contains every field).
// Edit mode reuses the same form and only submits the editable fields.
type FormValues = z.input<typeof accountCreateSchema>;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Account;
}

export function AccountForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: AccountFormProps) {
  const isEditing = !!initialData;
  const [accountLevel, setAccountLevel] = useState<"root" | "child">(
    initialData?.parent_id ? "child" : "root"
  );
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Initial values are derived from initialData here (no setState-in-effect).
  // The parent renders this with a `key`, so it remounts per record.
  const form = useForm<FormValues>({
    resolver: zodResolver(accountCreateSchema),
    defaultValues: initialData
      ? {
          name_ar: initialData.name_ar,
          name_en: initialData.name_en,
          account_type: initialData.account_type,
          normal_balance: initialData.normal_balance,
          parent_id: initialData.parent_id,
          account_code: initialData.account_code,
          is_active: initialData.is_active,
          description: initialData.description ?? "",
        }
      : {
          name_ar: "",
          name_en: "",
          account_type: "Assets",
          normal_balance: "Debit",
          parent_id: null,
          account_code: "",
          is_active: true,
          description: "",
        },
  });

  // Load potential parents (create + child mode only).
  useEffect(() => {
    if (!open || isEditing || accountLevel !== "child") return;
    let active = true;
    (async () => {
      setLoadingParents(true);
      try {
        const res = await fetch("/api/accounts");
        const json = await res.json();
        if (active && json.success) setAllAccounts(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoadingParents(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, isEditing, accountLevel]);

  // Auto-default the normal balance from the account type (create only).
  const watchType = useWatch({ control: form.control, name: "account_type" });
  useEffect(() => {
    if (isEditing) return;
    if (watchType && ACCOUNT_TYPES.includes(watchType as AccountType)) {
      form.setValue("normal_balance", getDefaultNormalBalance(watchType as AccountType));
    }
  }, [watchType, isEditing, form]);

  // Preview the auto-generated child code (parent code + next 2-digit suffix).
  const watchParent = useWatch({ control: form.control, name: "parent_id" });
  const parentAccounts = allAccounts.filter((a) => a.is_active);
  let autoCodePreview = "";
  if (!isEditing && accountLevel === "child" && watchParent) {
    const parent = allAccounts.find((p) => p.id === watchParent);
    if (parent) {
      let max = 0;
      allAccounts
        .filter((a) => a.parent_id === watchParent)
        .forEach((s) => {
          const m = s.account_code.match(
            new RegExp(`^${parent.account_code}(\\d{2})$`)
          );
          if (m) max = Math.max(max, parseInt(m[1], 10));
        });
      autoCodePreview = `${parent.account_code}${String(max + 1).padStart(2, "0")}`;
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const url = isEditing ? `/api/accounts/${initialData!.id}` : "/api/accounts";
      const method = isEditing ? "PATCH" : "POST";

      let payload: Record<string, unknown>;
      if (isEditing) {
        // Only the editable fields (DEC-068: code/type/balance are locked).
        payload = {
          name_ar: values.name_ar,
          name_en: values.name_en,
          is_active: values.is_active,
          description: values.description ?? null,
        };
      } else if (accountLevel === "child") {
        // Child: omit account_code → DB trigger auto-generates it.
        payload = {
          name_ar: values.name_ar,
          name_en: values.name_en,
          account_type: values.account_type,
          normal_balance: values.normal_balance,
          parent_id: values.parent_id,
          is_active: values.is_active,
          description: values.description ?? null,
        };
      } else {
        // Root: manual account_code, no parent.
        payload = {
          name_ar: values.name_ar,
          name_en: values.name_en,
          account_type: values.account_type,
          normal_balance: values.normal_balance,
          parent_id: null,
          account_code: values.account_code,
          is_active: values.is_active,
          description: values.description ?? null,
        };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Account ${isEditing ? "updated" : "created"} successfully.`);
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
        {!isEditing && (
          <div className="flex gap-4">
            <Button
              type="button"
              variant={accountLevel === "root" ? "default" : "outline"}
              onClick={() => {
                setAccountLevel("root");
                form.setValue("parent_id", null);
              }}
            >
              Root Account
            </Button>
            <Button
              type="button"
              variant={accountLevel === "child" ? "default" : "outline"}
              onClick={() => {
                setAccountLevel("child");
                form.setValue("account_code", "");
              }}
            >
              Child Account
            </Button>
          </div>
        )}

        {!isEditing && accountLevel === "root" && (
          <FormField
            control={form.control}
            name="account_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isEditing && accountLevel === "child" && (
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Account *</FormLabel>
                <Select value={field.value ?? null} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent account">
                        {(value: string) => {
                          const p = allAccounts.find((a) => a.id === value);
                          return p
                            ? `${p.account_code} - ${p.name_en}`
                            : "Select parent account";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingParents ? (
                      <SelectItem value="__loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      parentAccounts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.account_code} - {p.name_en}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
                {autoCodePreview && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Auto-generated code: <strong>{autoCodePreview}</strong>
                  </p>
                )}
              </FormItem>
            )}
          />
        )}

        {isEditing && (
          <FormItem>
            <FormLabel>Account Code</FormLabel>
            <Input value={initialData!.account_code} disabled />
          </FormItem>
        )}

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
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            name="normal_balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Normal Balance *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select balance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Debit">Debit</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
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