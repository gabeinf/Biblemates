import { supabase } from '../lib/supabase';

const BUCKET = 'avatars';

/** Uploads a local image (file:// uri from the image picker) and returns its public URL. */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const body = await (await fetch(localUri)).arrayBuffer();
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Same path on every upload, so bust caches with a version param.
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function removeAvatar(userId: string) {
  await supabase.storage.from(BUCKET).remove([`${userId}/avatar.jpg`]);
}

export async function updateProfile(userId: string, patch: { display_name?: string; avatar_url?: string | null }) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(error.message);
}
