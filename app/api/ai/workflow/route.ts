import { NextRequest, NextResponse } from "next/server";
import { withSession } from "@/lib/api";
import { getCurrentUser } from "@/lib/user";
import { getGoogleClients } from "@/lib/google";
import { generateJSON } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";
import type { WorkflowStep } from "@/types/db";

const workflowPrompt = (noteContent: string) => `You are a planning assistant. Turn the following note into an actionable,
ordered workflow. Return ONLY valid JSON, no markdown, in this shape:
{"title": string, "steps": [{"title": string, "detail": string, "estimate_minutes": number}]}

NOTE:
"""
${noteContent}
"""`;

export async function POST(request: NextRequest) {
  return withSession(async (session) => {
    const user = await getCurrentUser(session);
    const { noteId, text } = (await request.json()) as { noteId?: string; text?: string };

    let noteContent = text ?? "";
    if (noteId) {
      const { drive } = getGoogleClients(session);
      const { data } = await drive.files.get(
        { fileId: noteId, alt: "media" },
        { responseType: "text" }
      );
      noteContent = data as unknown as string;
    }

    if (!noteContent.trim()) {
      return NextResponse.json({ error: "No note content provided" }, { status: 400 });
    }

    const workflow = await generateJSON<{ title: string; steps: WorkflowStep[] }>(
      workflowPrompt(noteContent)
    );

    const { data: saved, error } = await supabaseAdmin
      .from("workflows")
      .insert({
        user_id: user.id,
        source_note_id: noteId ?? null,
        title: workflow.title,
        steps: workflow.steps,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json(saved);
  });
}
