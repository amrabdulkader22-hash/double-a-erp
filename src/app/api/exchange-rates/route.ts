import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";

/**
 * GET  /api/exchange-rates       → List all exchange_rates (soft-deleted excluded)
 * POST /api/exchange-rates       → Create new exchange_rates
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("exchange_rates")
      .select("*")
      .eq("is_deleted", false)
      .order("rate_date", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch exchange_rates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("exchange_rates")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create exchange_rates" },
      { status: 500 }
    );
  }
}
