import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const { error } = await supabaseAdmin.from("reminders").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  });
}
