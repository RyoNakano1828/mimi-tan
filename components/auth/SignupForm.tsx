"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/authClient";
import { formatAuthError, isSupabaseConfigured } from "@/lib/authErrors";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configured) {
      setError("Supabase の環境変数が設定されていません（.env を確認）");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({} as { error?: string }));

      if (!res.ok) {
        throw new Error(data.error || `新規登録に失敗しました (${res.status})`);
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        router.push("/?registered=1");
        return;
      }

      router.push("/app");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2 className="auth-title">新規登録</h2>
      <p className="auth-subtitle">アカウントを作成して学習を始めましょう</p>

      {!configured && (
        <p className="auth-alert auth-alert--error">
          Supabase の URL / ANON KEY が未設定です
        </p>
      )}

      <label className="auth-field">
        <span className="auth-label">メールアドレス</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="auth-input"
        />
      </label>

      <label className="auth-field">
        <span className="auth-label">パスワード</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6文字以上"
          required
          minLength={6}
          autoComplete="new-password"
          className="auth-input"
        />
      </label>

      <label className="auth-field">
        <span className="auth-label">パスワード（確認）</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="もう一度入力"
          required
          minLength={6}
          autoComplete="new-password"
          className="auth-input"
        />
      </label>

      {error && <p className="auth-alert auth-alert--error">{error}</p>}

      <button
        type="submit"
        disabled={loading || !configured}
        className="auth-btn auth-btn--primary"
      >
        {loading ? "登録中..." : "アカウントを作成"}
      </button>
    </form>
  );
}
