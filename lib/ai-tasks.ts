import { generateJSON } from "@/lib/gemini";
import { fetchNews } from "@/lib/news";
import { supabaseAdmin } from "@/lib/supabase";
import type { IdeasPayload, NewsPayload, ProgressPayload } from "@/types/db";

// Shared by the interactive /api/ai/* routes (triggered by the signed-in user)
// and the /api/cron/* routes (triggered by Vercel on a schedule) so both run
// the exact same Gemini prompts against the exact same data.

const progressPrompt = (tasksJson: string) => `You are a productivity coach. Given this JSON of the user's tasks from the last
7 days (with status and deadlines), analyze their progress. Return ONLY valid
JSON: {"summary": string, "whats_behind": string[], "suggested_priorities": string[]}

TASKS:
${tasksJson}`;

const ideasPrompt = (interests: string, tasksJson: string, deadlinesJson: string) => `Given the user's interests ${interests}, their open tasks ${tasksJson}, and
upcoming deadlines ${deadlinesJson}, suggest 1-2 concrete, specific ideas or
focuses for today. Return ONLY valid JSON: {"ideas": [{"idea": string, "why": string}]}`;

const newsPrompt = (interests: string, articlesJson: string) => `Here are today's news articles as JSON (title, description, url, source). The
user cares about: ${interests}. Pick the 5 most relevant, summarize each in one
sentence, and explain relevance briefly. Return ONLY valid JSON:
{"items": [{"title": string, "summary": string, "why_relevant": string, "url": string, "source": string}]}

ARTICLES:
${articlesJson}`;

export async function runProgressForUser(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: tasks, error } = await supabaseAdmin
    .from("tasks")
    .select("title, status, deadline, priority")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo);

  if (error) throw error;

  const payload = await generateJSON<ProgressPayload>(progressPrompt(JSON.stringify(tasks ?? [])));

  const { data: saved, error: insertError } = await supabaseAdmin
    .from("ai_suggestions")
    .insert({ user_id: userId, type: "progress", payload })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return saved;
}

export async function runIdeasForUser(userId: string) {
  const [{ data: settings }, { data: openTasks, error }] = await Promise.all([
    supabaseAdmin.from("settings").select("interests").eq("user_id", userId).maybeSingle(),
    supabaseAdmin
      .from("tasks")
      .select("title, deadline, priority")
      .eq("user_id", userId)
      .neq("status", "done"),
  ]);

  if (error) throw error;

  const upcomingDeadlines = (openTasks ?? []).filter((t) => t.deadline);

  const payload = await generateJSON<IdeasPayload>(
    ideasPrompt(
      (settings?.interests ?? []).join(", ") || "general productivity",
      JSON.stringify(openTasks ?? []),
      JSON.stringify(upcomingDeadlines)
    )
  );

  const { data: saved, error: insertError } = await supabaseAdmin
    .from("ai_suggestions")
    .insert({ user_id: userId, type: "idea", payload })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return saved;
}

export async function runNewsForUser(userId: string) {
  const { data: settings } = await supabaseAdmin
    .from("settings")
    .select("interests, news_keywords")
    .eq("user_id", userId)
    .maybeSingle();

  const articles = await fetchNews(settings?.news_keywords ?? settings?.interests ?? []);

  const payload = await generateJSON<NewsPayload>(
    newsPrompt((settings?.interests ?? []).join(", ") || "general news", JSON.stringify(articles))
  );

  const { data: saved, error } = await supabaseAdmin
    .from("ai_suggestions")
    .insert({ user_id: userId, type: "news", payload })
    .select("*")
    .single();

  if (error) throw error;
  return saved;
}
