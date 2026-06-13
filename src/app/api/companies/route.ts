import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { companyCreateSchema } from "@/lib/types/system-administration.types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { searchParams } = new URL(request.url);

    let query = supabase
      .from("companies")
      .select("*, currencies(currency_code, name_en)") // ✅ JOIN with currencies
      .eq("is_deleted", false)
      .order("company_code", { ascending: true });

    if (searchParams.get('is_active')) {
      query = query.eq('is_active', searchParams.get('is_active') === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch companies";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient();
    const body = await request.json();

    const parsed = companyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("companies")
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create company";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}