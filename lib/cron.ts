import type { NextRequest } from "next/server";

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set as an env var. */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}
