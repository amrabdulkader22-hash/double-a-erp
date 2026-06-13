import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { branchCreateSchema } from "@/lib/types/system-administration.types";

export async function GET() {
  try {
    const supabase = await createApiClient();
    const { data, error } = await supabase
      .from("branches")
      .select("*, companies(company_code, legal_name_en, legal_name_ar)") // ✅ JOIN مع الشركات
      .eq("is_deleted", false)
      .order("branch_code", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch branches";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const parsed = branchCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("branches")
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create branch";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
