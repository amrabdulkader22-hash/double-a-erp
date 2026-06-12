import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";

/**
 * GET  /api/accounting-periods       → List all accounting_periods (soft-deleted excluded)
 * POST /api/accounting-periods       → Create new accounting_periods
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("accounting_periods")
      .select("*")
      .eq("is_deleted", false)
      .order("period_number", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch accounting_periods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("accounting_periods")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create accounting_periods" },
      { status: 500 }
    );
  }
}
