import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const { data, error } = await supabaseAdmin
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("remind_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const { title, note, remind_at } = (await request.json()) as {
      title: string;
      note?: string;
      remind_at: string;
    };

    const { data, error } = await supabaseAdmin
      .from("reminders")
      .insert({ user_id: user.id, title, note, remind_at })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  });
}
