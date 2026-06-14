import { z } from "zod";

export type AccountType = "Assets" | "Liabilities" | "Equity" | "Revenue" | "Expenses" | "CostOfSales";
export type NormalBalance = "Debit" | "Credit";

export const ACCOUNT_TYPES: AccountType[] = [
  "Assets",
  "Liabilities",
  "Equity",
  "Revenue",
  "Expenses",
  "CostOfSales",
];

export const getDefaultNormalBalance = (type: AccountType): NormalBalance => {
  switch (type) {
    case "Assets":
    case "Expenses":
    case "CostOfSales":
      return "Debit";
    case "Liabilities":
    case "Equity":
    case "Revenue":
      return "Credit";
    default:
      return "Debit";
  }
};

export interface Account {
  id: string;
  account_code: string;
  name_ar: string;
  name_en: string;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent_id: string | null;
  level: number;
  is_postable: boolean;
  is_active: boolean;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
}

export const accountCreateSchema = z
  .object({
    name_ar: z.string().min(1, "Arabic name required"),
    name_en: z.string().min(1, "English name required"),
    account_type: z.enum(ACCOUNT_TYPES),
    normal_balance: z.enum(["Debit", "Credit"]),
    parent_id: z.string().uuid().nullable().optional(),
    account_code: z.string().optional(),
    is_active: z.boolean().default(true),
    description: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.parent_id && !data.account_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Account code is required for root accounts",
        path: ["account_code"],
      });
    }
  });

export const accountUpdateSchema = z.object({
  name_ar: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  description: z.string().optional().nullable(),
});
