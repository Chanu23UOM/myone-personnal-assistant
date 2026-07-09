import { NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchNews } from "@/lib/news";

export async function GET() {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const { data: settings } = await supabaseAdmin
      .from("settings")
      .select("news_keywords")
      .eq("user_id", user.id)
      .maybeSingle();

    const articles = await fetchNews(settings?.news_keywords ?? []);
    return NextResponse.json(articles);
  });
}
