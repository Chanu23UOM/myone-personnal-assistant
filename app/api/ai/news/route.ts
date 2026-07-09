import { NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { runNewsForUser } from "@/lib/ai-tasks";

export async function POST() {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const saved = await runNewsForUser(user.id);
    return NextResponse.json(saved);
  });
}
