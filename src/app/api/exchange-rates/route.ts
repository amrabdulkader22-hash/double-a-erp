import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase-api";
import { exchangeRateCreateSchema } from "@/lib/types/system-administration.types";

export async function GET() {
  try {
    const supabase = await createApiClient();
    const query = supabase
      .from("exchange_rates")
      .select("*, currencies(currency_code, name_en)")
      .eq("is_deleted", false)
      .order("rate_date", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch exchange_rates";
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

    const parsed = exchangeRateCreateSchema.safeParse(body);
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
      .from("exchange_rates")
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create exchange_rates";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
