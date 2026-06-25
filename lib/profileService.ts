import { supabase } from './supabaseClient';

export type Profile = {
  id: string;
  auth_id: string | null;
  email: string | null;
  display_name: string | null;
  metadata: any | null;
};

export async function getProfile(): Promise<Profile | null> {
  // Select the profile row for the current authenticated user.
  // RLS policy allows selecting when auth_id = auth.uid(), so this will return the user's row (or null).
  const { data, error } = await supabase
    .from('users')
    .select('id, auth_id, email, display_name, metadata')
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function createProfile(display_name?: string, metadata?: any): Promise<Profile> {
  // Create a new public.users row for the current auth user.
  const userResp = await supabase.auth.getUser();
  const authUserId = userResp.data.user?.id;
  const email = userResp.data.user?.email ?? null;
  if (!authUserId) throw new Error('Not authenticated');

  const insertBody: any = {
    auth_id: authUserId,
    email,
    display_name: display_name ?? null,
    metadata: metadata ?? null
  };

  const { data, error } = await supabase
    .from('users')
    .insert(insertBody)
    .select('id, auth_id, email, display_name, metadata')
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(profileId: string, fields: { display_name?: string | null; metadata?: any | null; email?: string | null; }): Promise<Profile> {
  const { data, error } = await supabase
    .from('users')
    .update(fields)
    .eq('id', profileId)
    .select('id, auth_id, email, display_name, metadata')
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getOrCreateProfileId(): Promise<string> {
  const profile = await getProfile();
  if (profile?.id) return profile.id;
  const created = await createProfile();
  return created.id;
}
