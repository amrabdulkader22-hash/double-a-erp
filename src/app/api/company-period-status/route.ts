import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { periodStatusChangeSchema } from "@/lib/types/system-administration.types";

/**
 * GET  /api/company-period-status       → List all company_period_status (soft-deleted excluded)
 * POST /api/company-period-status       → Create new company_period_status
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const query = supabase
      .from("company_period_status")
      .select("*")
      .eq("is_deleted", false)
      .order("status", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch company_period_status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const parsed = periodStatusChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("company_period_status")
      .insert({
        company_id: parsed.data.company_id,
        accounting_period_id: parsed.data.accounting_period_id,
        status: parsed.data.status,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create company_period_status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
