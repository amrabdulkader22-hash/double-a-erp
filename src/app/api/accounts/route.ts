import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { accountCreateSchema } from "@/lib/types/accounts.types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("accounts")
      .select("*, parent:parent_id(account_code, name_ar, name_en)")
      .eq("is_deleted", false)
      .order("account_code", { ascending: true });

    if (searchParams.get("is_active")) {
      query = query.eq("is_active", searchParams.get("is_active") === "true");
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch accounts";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const parsed = accountCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // For child accounts let the DB trigger generate the code.
    const payload: Record<string, unknown> = { ...parsed.data };
    if (payload.parent_id && (!payload.account_code || payload.account_code === "")) {
      delete payload.account_code;
    }

    const { data, error } = await supabase
      .from("accounts")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create account";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}