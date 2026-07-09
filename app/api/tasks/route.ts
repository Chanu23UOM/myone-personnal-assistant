import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { getGoogleClients } from "@/lib/google";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const week = request.nextUrl.searchParams.get("week");
    const status = request.nextUrl.searchParams.get("status");

    let query = supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("deadline", { ascending: true, nullsFirst: false });

    if (week) query = query.eq("semester_week", Number(week));
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const body = await request.json();
    const { title, description, deadline, semester_week, priority, sync_to_calendar } = body as {
      title: string;
      description?: string;
      deadline?: string;
      semester_week?: number;
      priority?: string;
      sync_to_calendar?: boolean;
    };

    let calendarEventId: string | null = null;
    if (deadline && sync_to_calendar) {
      const { calendar } = getGoogleClients(session);
      const start = new Date(deadline);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const { data: event } = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: title,
          description,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          reminders: {
            useDefault: false,
            overrides: [{ method: "popup", minutes: 60 }],
          },
        },
      });
      calendarEventId = event.id ?? null;
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        user_id: user.id,
        title,
        description,
        deadline,
        semester_week,
        priority: priority ?? "normal",
        calendar_event_id: calendarEventId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  });
}
