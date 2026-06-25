import "server-only";

import { createAnonClient } from "./supabaseAdmin";
import type { User } from "@supabase/supabase-js";

export async function getUserFromRequest(
  request: Request
): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabase = createAnonClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function requireAuthHeader(request: Request): string {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("ログインが必要です");
  }
  return authHeader.slice(7);
}
