import { AuthApiError } from "@supabase/supabase-js";

export function formatAuthError(err: unknown): string {
  if (!err) return "認証に失敗しました";

  if (err instanceof AuthApiError) {
    if (err.message?.trim() && err.message !== "{}") return err.message;
    return `Supabase Auth エラー (${err.status ?? "unknown"})`;
  }

  if (typeof err === "string") {
    return err === "{}" ? "認証に失敗しました" : err;
  }

  if (err instanceof Error) {
    const msg = err.message?.trim();
    if (msg && msg !== "{}") return msg;
  }

  if (typeof err === "object" && err !== null) {
    const e = err as {
      message?: string;
      error_description?: string;
      msg?: string;
      code?: string;
      status?: number;
    };
    if (e.message?.trim() && e.message !== "{}") return e.message;
    if (e.error_description) return e.error_description;
    if (e.msg) return e.msg;
    if (e.code) return `Supabase エラー: ${e.code}`;
    if (e.status === 422) return "メールアドレスまたはパスワードが不正です";
    if (e.status === 429) return "リクエストが多すぎます。しばらく待ってください";
  }

  return "認証に失敗しました。Supabaseの設定とマイグレーションを確認してください";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
