import { supabaseAdmin } from "./clients";

/**
 * Resolves a Supabase access token (from `Authorization: Bearer …` or the
 * Socket.IO handshake) to a user id. Returns null when missing or invalid.
 */
export async function userIdFromToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export function bearer(header: string | undefined): string | null {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
