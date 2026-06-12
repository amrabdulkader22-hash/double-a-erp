import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";

/**
 * GET    /api/exchange-rates/[id]  → Get one Exchange Rates by UUID
 * PATCH  /api/exchange-rates/[id]  → Update Exchange Rates
 * DELETE /api/exchange-rates/[id]  → Soft-delete Exchange Rates
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createApiClient();

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Exchange Rates not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch Exchange Rates" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createApiClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("exchange_rates")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update Exchange Rates" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createApiClient();

    const { data, error } = await supabase
      .from("exchange_rates")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete Exchange Rates" },
      { status: 500 }
    );
  }
}
