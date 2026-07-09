import { google } from "googleapis";
import type { Session } from "next-auth";

/**
 * Builds authenticated Calendar/Drive clients from the current session's
 * access token. The token itself is kept fresh by the NextAuth jwt callback
 * (see lib/auth.ts), so callers never need to refresh it here.
 */
export function getGoogleClients(session: Session) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: session.accessToken });

  return {
    calendar: google.calendar({ version: "v3", auth }),
    drive: google.drive({ version: "v3", auth }),
  };
}
