import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";

/**
 * GET  /api/fiscal-years       → List all fiscal_years (soft-deleted excluded)
 * POST /api/fiscal-years       → Create new fiscal_years
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("fiscal_years")
      .select("*")
      .eq("is_deleted", false)
      .order("start_date", { ascending: true });
    if (searchParams.get('status')) {
      query = query.eq('status', searchParams.get('status') === 'true')
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch fiscal_years" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("fiscal_years")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create fiscal_years" },
      { status: 500 }
    );
  }
}
