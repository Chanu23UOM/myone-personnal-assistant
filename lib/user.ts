import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { User } from "@/types/db";

/** Resolves the signed-in session, throwing if there isn't one. */
export async function requireSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }
  return session;
}

/**
 * Resolves the signed-in user's email into a stable `users` row,
 * creating it on first login. All other tables are scoped by this id.
 */
export async function getCurrentUser(session?: Session): Promise<User> {
  const activeSession = session ?? (await requireSession());
  const email = activeSession.user?.email;
  if (!email) throw new Error("Session has no email");

  const { data: existing, error: selectError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as User;

  const { data: created, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({ email, name: activeSession.user?.name ?? null })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created as User;
}
