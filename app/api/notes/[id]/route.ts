import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { withSession } from "@/lib/api";
import { getGoogleClients } from "@/lib/google";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withSession(async (session) => {
    const { drive } = getGoogleClients(session);

    const [{ data: meta }, { data: content }] = await Promise.all([
      drive.files.get({ fileId: id, fields: "id, name, modifiedTime" }),
      drive.files.get({ fileId: id, alt: "media" }, { responseType: "text" }),
    ]);

    return NextResponse.json({ ...meta, content });
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withSession(async (session) => {
    const { drive } = getGoogleClients(session);
    const { content, name } = (await request.json()) as { content: string; name?: string };

    const { data } = await drive.files.update({
      fileId: id,
      requestBody: name ? { name } : undefined,
      media: {
        mimeType: "text/plain",
        body: Readable.from(content ?? ""),
      },
      fields: "id, name, modifiedTime",
    });

    return NextResponse.json(data);
  });
}
