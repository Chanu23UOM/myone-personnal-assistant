import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const type = request.nextUrl.searchParams.get("type");

    let query = supabaseAdmin
      .from("ai_suggestions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data?.[0] ?? null);
  });
}
