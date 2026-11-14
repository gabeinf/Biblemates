/**
 * Calls to apps/server (Scripture search + chat). The URL comes from
 * EXPO_PUBLIC_SERVER_URL so swapping the laptop for a hosted server is a
 * one-line env change. Requests carry the user's Supabase access token.
 */
import { supabase } from './supabase';

export const SERVER_URL = (process.env.EXPO_PUBLIC_SERVER_URL ?? '').replace(/\/+$/, '');

export async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again.');
  return token;
}

/** POSTs JSON to the server. The server falls back on its own after 10s; 15s is the hard stop. */
export async function postJson<T>(path: string, body: unknown, timeoutMs = 15_000): Promise<T> {
  if (!SERVER_URL) throw new Error('EXPO_PUBLIC_SERVER_URL is not set.');
  const token = await accessToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${SERVER_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? `Server error (${res.status})`);
  return json as T;
}
