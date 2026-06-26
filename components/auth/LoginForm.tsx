"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/authClient";
import { formatAuthError, isSupabaseConfigured } from "@/lib/authErrors";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configured) {
      setError("Supabase の環境変数が設定されていません（.env を確認）");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      router.push("/app");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2 className="auth-title">ログイン</h2>
      <p className="auth-subtitle">メールアドレスとパスワードでログイン</p>

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
          autoComplete="current-password"
          className="auth-input"
        />
      </label>

      {error && <p className="auth-alert auth-alert--error">{error}</p>}

      <button
        type="submit"
        disabled={loading || !configured}
        className="auth-btn auth-btn--primary"
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
