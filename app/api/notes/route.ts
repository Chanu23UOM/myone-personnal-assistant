import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { withSession } from "@/lib/api";
import { getGoogleClients } from "@/lib/google";
import { getOrCreateNotesFolder } from "@/lib/notes";
import { getCurrentUser } from "@/lib/user";

export async function GET() {
  return withSession(async (session) => {
    const { drive } = getGoogleClients(session);
    const user = await getCurrentUser(session);
    const folderId = await getOrCreateNotesFolder(drive, user.id);

    const { data } = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, modifiedTime)",
      orderBy: "modifiedTime desc",
    });

    return NextResponse.json(data.files ?? []);
  });
}

export async function POST(request: NextRequest) {
  return withSession(async (session) => {
    const { drive } = getGoogleClients(session);
    const user = await getCurrentUser(session);
    const folderId = await getOrCreateNotesFolder(drive, user.id);

    const { name, content } = (await request.json()) as { name: string; content?: string };

    const { data } = await drive.files.create({
      requestBody: {
        name: name || "Untitled note",
        parents: [folderId],
        mimeType: "text/plain",
      },
      media: {
        mimeType: "text/plain",
        body: Readable.from(content ?? ""),
      },
      fields: "id, name, modifiedTime",
    });

    return NextResponse.json(data);
  });
}
