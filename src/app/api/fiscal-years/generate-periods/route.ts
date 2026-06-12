import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";

/**
 * POST /api/fiscal-years/generate-periods
 * Body: { fiscal_year_id: string }
 * Calls the PostgreSQL function generate_accounting_periods()
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { fiscal_year_id } = await request.json();

    if (!fiscal_year_id) {
      return NextResponse.json(
        { success: false, error: "fiscal_year_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("generate_accounting_periods", {
      p_fiscal_year_id: fiscal_year_id,
    });

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Periods generated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate periods" },
      { status: 500 }
    );
  }
}
