import "server-only";

import { createAdminClient } from "./supabaseAdmin";
import { DEFAULT_SITUATIONS, DEFAULT_THEMES } from "./defaults";
import type { UserPreferenceItem } from "./types";
import type { User } from "@supabase/supabase-js";

export type { UserPreferenceItem };

async function getOrCreateProfileId(
  admin: ReturnType<typeof createAdminClient>,
  user: User
): Promise<string> {
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("users")
    .insert({
      auth_id: user.id,
      email: user.email ?? null,
      display_name: user.email ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

async function seedDefaults(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  table: "user_themes" | "user_situations",
  names: readonly string[]
) {
  const rows = names.map((name) => ({ user_id: profileId, name }));
  await admin.from(table).upsert(rows, {
    onConflict: "user_id,name",
    ignoreDuplicates: true,
  });
}

export async function listUserThemes(user: User): Promise<UserPreferenceItem[]> {
  const admin = createAdminClient();
  const profileId = await getOrCreateProfileId(admin, user);

  const { data, error } = await admin
    .from("user_themes")
    .select("id, name, created_at")
    .eq("user_id", profileId)
    .order("created_at");

  if (error) throw error;

  if (!data || data.length === 0) {
    await seedDefaults(admin, profileId, "user_themes", DEFAULT_THEMES);
    const { data: seeded, error: seedError } = await admin
      .from("user_themes")
      .select("id, name, created_at")
      .eq("user_id", profileId)
      .order("created_at");
    if (seedError) throw seedError;
    return seeded ?? [];
  }

  return data;
}

export async function addUserTheme(
  user: User,
  name: string
): Promise<UserPreferenceItem> {
  const admin = createAdminClient();
  const profileId = await getOrCreateProfileId(admin, user);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("テーマ名を入力してください");

  const { data, error } = await admin
    .from("user_themes")
    .insert({ user_id: profileId, name: trimmed })
    .select("id, name, created_at")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("同じテーマが既に存在します");
    throw error;
  }
  return data;
}

export async function deleteUserTheme(
  user: User,
  id: string
): Promise<void> {
  const admin = createAdminClient();
  const profileId = await getOrCreateProfileId(admin, user);

  const { error } = await admin
    .from("user_themes")
    .delete()
    .eq("id", id)
    .eq("user_id", profileId);

  if (error) throw error;
}

export async function listUserSituations(
  user: User
): Promise<UserPreferenceItem[]> {
  const admin = createAdminClient();
  const profileId = await getOrCreateProfileId(admin, user);

  const { data, error } = await admin
    .from("user_situations")
    .select("id, name, created_at")
    .eq("user_id", profileId)
    .order("created_at");

  if (error) throw error;

  if (!data || data.length === 0) {
    await seedDefaults(admin, profileId, "user_situations", DEFAULT_SITUATIONS);
    const { data: seeded, error: seedError } = await admin
      .from("user_situations")
      .select("id, name, created_at")
      .eq("user_id", profileId)
      .order("created_at");
    if (seedError) throw seedError;
    return seeded ?? [];
  }

  return data;
}

export async function addUserSituation(
  user: User,
  name: string
): Promise<UserPreferenceItem> {
  const admin = createAdminClient();
  const profileId = await getOrCreateProfileId(admin, user);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("シチュエーション名を入力してください");

  const { data, error } = await admin
    .from("user_situations")
    .insert({ user_id: profileId, name: trimmed })
    .select("id, name, created_at")
    .single();

  if (error) {
    if (error.code === "23505")
      throw new Error("同じシチュエーションが既に存在します");
    throw error;
  }
  return data;
}

export async function deleteUserSituation(
  user: User,
  id: string
): Promise<void> {
  const admin = createAdminClient();
  const profileId = await getOrCreateProfileId(admin, user);

  const { error } = await admin
    .from("user_situations")
    .delete()
    .eq("id", id)
    .eq("user_id", profileId);

  if (error) throw error;
}
