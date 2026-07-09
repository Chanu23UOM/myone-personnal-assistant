import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const week = request.nextUrl.searchParams.get("week");
    const date = request.nextUrl.searchParams.get("date");

    let query = supabaseAdmin.from("semester_notes").select("*").eq("user_id", user.id);
    if (week) query = query.eq("semester_week", Number(week));
    if (date) query = query.eq("note_date", date);

    const { data, error } = await query.order("note_date", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  });
}

// Upserts the note for a given date (one note per day, per the unique
// (user_id, note_date) constraint in the schema).
export async function POST(request: NextRequest) {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const { note_date, semester_week, content } = (await request.json()) as {
      note_date: string;
      semester_week?: number;
      content?: string;
    };

    const { data, error } = await supabaseAdmin
      .from("semester_notes")
      .upsert(
        { user_id: user.id, note_date, semester_week, content },
        { onConflict: "user_id,note_date" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  });
}
