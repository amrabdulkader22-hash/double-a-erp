import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { currencyCreateSchema } from "@/lib/types/system-administration.types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("currencies")
      .select("*")
      .eq("is_deleted", false)
      .order("currency_code", { ascending: true });
    if (searchParams.get('is_active')) {
      query = query.eq('is_active', searchParams.get('is_active') === 'true');
    }
    if (searchParams.get('is_base')) {
      query = query.eq('is_base', searchParams.get('is_base') === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch currencies";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const parsed = currencyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("currencies")
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create currency";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
