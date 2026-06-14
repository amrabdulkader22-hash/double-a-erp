import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { fiscalYearCreateSchema } from "@/lib/types/system-administration.types";

export async function GET() {
  try {
    const supabase = await createApiClient();
    const { data, error } = await supabase
      .from("fiscal_years")
      .select("*")
      .eq("is_deleted", false)
      .order("start_date", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load fiscal years";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();
    const parsed = fiscalYearCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { data, error } = await supabase
      .from("fiscal_years").insert(parsed.data).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create fiscal year";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}