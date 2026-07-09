import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runProgressForUser } from "@/lib/ai-tasks";
import { isAuthorizedCronRequest } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: users, error } = await supabaseAdmin.from("users").select("id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = await Promise.allSettled((users ?? []).map((u) => runProgressForUser(u.id)));
  const failures = results.filter((r) => r.status === "rejected");

  return NextResponse.json({ users: users?.length ?? 0, ran: results.length, failures: failures.length });
}
