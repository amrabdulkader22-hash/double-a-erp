import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { exchangeRateUpdateSchema } from "@/lib/types/system-administration.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createApiClient();
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*, currencies(currency_code, name_en)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Not found";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
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

    const parsed = exchangeRateUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("exchange_rates")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createApiClient();
    const { error } = await supabase
      .from("exchange_rates")
      .update({ is_deleted: true })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true, data: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}