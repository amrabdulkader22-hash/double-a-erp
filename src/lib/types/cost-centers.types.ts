import { z } from "zod";

export type CostCenterType =
  | "Project" | "Building" | "Unit" | "Administrative" | "Other";

export const COST_CENTER_TYPES: CostCenterType[] = [
  "Project", "Building", "Unit", "Administrative", "Other",
];

export interface CostCenter {
  id: string;
  company_id: string;
  parent_id: string | null;
  cost_center_code: string;
  name_ar: string;
  name_en: string;
  cost_center_type: CostCenterType | null;
  start_date: string | null;
  end_date: string | null;
  is_under_construction: boolean;
  level: number;
  is_active: boolean;
  description_ar: string | null;
  description_en: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  is_deleted: boolean;
  deleted_by: string | null;
  deleted_at: string | null;
}

export const costCenterCreateSchema = z.object({
  company_id: z.string().uuid("Company is required"),
  parent_id: z.string().uuid().nullable().optional(),
  name_ar: z.string().min(1, "Arabic name required"),
  name_en: z.string().min(1, "English name required"),
  cost_center_type: z.enum(COST_CENTER_TYPES).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_under_construction: z.boolean().default(true),
  is_active: z.boolean().default(true),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
});

export const costCenterUpdateSchema = z.object({
  name_ar: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  cost_center_type: z.enum(COST_CENTER_TYPES).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_under_construction: z.boolean().optional(),
  is_active: z.boolean().optional(),
  description_ar: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
});