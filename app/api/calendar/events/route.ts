import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getGoogleClients } from "@/lib/google";

export async function GET(request: NextRequest) {
  return withSession(async (session) => {
    const { calendar } = getGoogleClients(session);

    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");

    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: start ?? new Date().toISOString(),
      timeMax: end ?? undefined,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json(data.items ?? []);
  });
}

export async function POST(request: NextRequest) {
  return withSession(async (session) => {
    const { calendar } = getGoogleClients(session);

    const body = await request.json();
    const { title, description, start, end } = body as {
      title: string;
      description?: string;
      start: string;
      end: string;
    };

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "popup", minutes: 10 },
          ],
        },
      },
    });

    return NextResponse.json(data);
  });
}
