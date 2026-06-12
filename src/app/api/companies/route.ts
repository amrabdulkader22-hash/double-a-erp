import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";

/**
 * GET  /api/companies       → List all companies (soft-deleted excluded)
 * POST /api/companies       → Create new companies
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("companies")
      .select("*")
      .eq("is_deleted", false)
      .order("company_code", { ascending: true });
    if (searchParams.get('is_active')) {
      query = query.eq('is_active', searchParams.get('is_active') === 'true')
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("companies")
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create companies" },
      { status: 500 }
    );
  }
}
