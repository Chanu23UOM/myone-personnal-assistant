import type { drive_v3 } from "googleapis";
import { supabaseAdmin } from "@/lib/supabase";

const NOTES_FOLDER_NAME = "PersonalAssistant Notes";

/**
 * Reuses the Drive folder id stored in `settings`, or creates the folder
 * (and stores its id) on first use. `drive.file` scope means the app can
 * only see files/folders it created itself.
 */
export async function getOrCreateNotesFolder(
  drive: drive_v3.Drive,
  userId: string
): Promise<string> {
  const { data: settings } = await supabaseAdmin
    .from("settings")
    .select("notes_folder_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (settings?.notes_folder_id) return settings.notes_folder_id;

  const { data: folder } = await drive.files.create({
    requestBody: {
      name: NOTES_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  const folderId = folder.id!;
  await supabaseAdmin
    .from("settings")
    .upsert({ user_id: userId, notes_folder_id: folderId }, { onConflict: "user_id" });

  return folderId;
}
