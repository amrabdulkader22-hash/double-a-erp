import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { periodStatusChangeSchema } from "@/lib/types/system-administration.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createApiClient();

    const { data, error } = await supabase
      .from("company_period_status")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: "Company Period Status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch period status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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

    const parsed = periodStatusChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("company_period_status")
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update period status";
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

    const { data, error } = await supabase
      .from("company_period_status")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete period status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
