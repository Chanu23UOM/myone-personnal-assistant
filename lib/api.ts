import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSession } from "@/lib/user";

/**
 * Wraps a route handler with the standard "resolve session or 401" flow
 * used by every authenticated API route in this app.
 */
export async function withSession(
  handler: (session: Session) => Promise<NextResponse>
): Promise<NextResponse> {
  let session: Session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handler(session);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
