import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { costCenterUpdateSchema } from "@/lib/types/cost-centers.types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createApiClient();
    const body = await request.json();

    const parsed = costCenterUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("cost_centers")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update cost center";
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

    const { count, error: cErr } = await supabase
      .from("cost_centers")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id)
      .eq("is_deleted", false);
    if (cErr) throw cErr;
    if (count && count > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete a cost center that has children" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("cost_centers")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete cost center";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}