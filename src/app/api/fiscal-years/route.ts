import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { z } from "zod";

const generatePeriodsSchema = z.object({
  fiscal_year_id: z.string().uuid("validation.invalidReference"),
});

/**
 * POST /api/fiscal-years/generate-periods
 * Body: { fiscal_year_id: string }
 * Calls the PostgreSQL function generate_accounting_periods()
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const parsed = generatePeriodsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { error } = await supabase.rpc("generate_accounting_periods", {
      p_fiscal_year_id: parsed.data.fiscal_year_id,
    });

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Periods generated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate periods";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}