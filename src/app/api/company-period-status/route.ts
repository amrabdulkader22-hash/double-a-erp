import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";

/**
 * GET  /api/company-period-status       → List all company_period_status (soft-deleted excluded)
 * POST /api/company-period-status       → Create new company_period_status
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("company_period_status")
      .select("*")
      .eq("is_deleted", false)
      .order("status", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch company_period_status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("company_period_status")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create company_period_status" },
      { status: 500 }
    );
  }
}
