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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  accountCreateSchema,
  accountUpdateSchema,
  type Account,
  ACCOUNT_TYPES,
  getDefaultNormalBalance,
  type AccountType,
} from "@/lib/types/accounts.types";

type FormValues = z.input<typeof accountCreateSchema>;
type UpdateFormValues = z.input<typeof accountUpdateSchema>;

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Account;
}

export function AccountForm({ open, onOpenChange, onSuccess, initialData }: AccountFormProps) {
  const isEditing = !!initialData;
  const [accountLevel, setAccountLevel] = useState<"root" | "child">(
    initialData?.parent_id ? "child" : "root"
  );
  const [parents, setParents] = useState<Account[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [autoCodePreview, setAutoCodePreview] = useState<string>("");
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (open && accountLevel === "child") {
      async function fetchParents() {
        setLoadingParents(true);
        try {
          const res = await fetch("/api/accounts?is_deleted=false");
          const json = await res.json();
          if (json.success) {
            setAllAccounts(json.data);
            setParents(json.data.filter((a: Account) => a.is_active));
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoadingParents(false);
        }
      }
      fetchParents();
    }
  }, [open, accountLevel]);

  const form = useForm<FormValues>({
    resolver: zodResolver(accountCreateSchema),
    defaultValues: {
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

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(accountUpdateSchema),
    defaultValues: {
      name_ar: "",
      name_en: "",
      is_active: true,
      description: "",
    },
  });

  const activeForm = isEditing ? updateForm : form;

  // مراقبة نوع الحساب فقط عند الإضافة
  const watchAccountType = !isEditing ? form.watch("account_type") : undefined;
  useEffect(() => {
    if (!isEditing && watchAccountType && ACCOUNT_TYPES.includes(watchAccountType as AccountType)) {
      const defaultBalance = getDefaultNormalBalance(watchAccountType as AccountType);
      form.setValue("normal_balance", defaultBalance);
    }
  }, [watchAccountType, isEditing, form]);

  const watchParentId = activeForm.watch("parent_id");
  useEffect(() => {
    if (accountLevel === "child" && watchParentId && allAccounts.length) {
      const parent = allAccounts.find((p) => p.id === watchParentId);
      if (parent) {
        const siblings = allAccounts.filter((a) => a.parent_id === watchParentId);
        let maxSuffix = 0;
        siblings.forEach((s) => {
          const match = s.account_code.match(new RegExp(`${parent.account_code}(\\d{2})$`));
          if (match) maxSuffix = Math.max(maxSuffix, parseInt(match[1], 10));
        });
        const nextNumber = (maxSuffix + 1).toString().padStart(2, "0");
        setAutoCodePreview(`${parent.account_code}${nextNumber}`);
      } else setAutoCodePreview("");
    } else setAutoCodePreview("");
  }, [watchParentId, accountLevel, allAccounts]);

  const onSubmit = async (values: FormValues | UpdateFormValues) => {
    try {
      const url = isEditing ? `/api/accounts/${initialData!.id}` : "/api/accounts";
      const method = isEditing ? "PATCH" : "POST";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any;
      if (!isEditing && accountLevel === "child") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { account_code, ...rest } = values as FormValues;
        payload = {
          ...rest,
          parent_id: watchParentId,
        };
      } else if (!isEditing && accountLevel === "root") {
        payload = values;
      } else {
        payload = values;
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
    <Form {...activeForm}>
      <form onSubmit={activeForm.handleSubmit(onSubmit)} className="space-y-4">
        {!isEditing && (
          <div className="flex gap-4">
            <Button
              type="button"
              variant={accountLevel === "root" ? "default" : "outline"}
              onClick={() => setAccountLevel("root")}
            >
              Root Account
            </Button>
            <Button
              type="button"
              variant={accountLevel === "child" ? "default" : "outline"}
              onClick={() => setAccountLevel("child")}
            >
              Child Account
            </Button>
          </div>
        )}

        {!isEditing && accountLevel === "root" && (
          <FormField
            control={activeForm.control}
            name="account_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isEditing && accountLevel === "child" && (
          <FormField
            control={activeForm.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Account *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingParents ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      parents.map((p) => (
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={activeForm.control}
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
            control={activeForm.control}
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
            control={activeForm.control}
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
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

          {!isEditing && (
            <FormField
              control={activeForm.control}
              name="normal_balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Normal Balance *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
          )}
        </div>

        <FormField
          control={activeForm.control}
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
          control={activeForm.control}
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