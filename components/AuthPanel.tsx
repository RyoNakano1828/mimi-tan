"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/authClient";
import { formatAuthError, isSupabaseConfigured } from "@/lib/authErrors";
import type { User } from "@supabase/supabase-js";

interface AuthPanelProps {
  onAuthChange?: (user: User | null) => void;
}

export default function AuthPanel({ onAuthChange }: AuthPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      onAuthChange?.(data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      onAuthChange?.(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignup = async () => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json().catch(() => ({} as { error?: string }));

    if (!res.ok) {
      const msg = data.error || `新規登録に失敗しました (${res.status})`;
      if (res.status === 409) {
        setMode("login");
      }
      throw new Error(msg);
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setMessage(
        "登録は完了しました。ログインタブからメールアドレスとパスワードでログインしてください"
      );
      setMode("login");
      return;
    }

    setMessage("登録完了！ログインしました");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configured) {
      setError("Supabase の環境変数が設定されていません（.env を確認）");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        setMessage("ログインしました");
      } else {
        await handleSignup();
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMessage("");
    setError("");
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    fontWeight: 600,
    background: active ? "var(--accent)" : "var(--bg-input)",
    color: active ? "#fff" : "var(--text-secondary)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
    borderRadius: "8px",
    cursor: "pointer",
  });

  if (user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 16px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        <span style={{ color: "var(--text-secondary)" }}>
          ログイン中: {user.email}
        </span>
        <button
          onClick={handleSignOut}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            background: "var(--bg-input)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        marginBottom: "24px",
      }}
    >
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
        保存・復習機能を使うにはログインが必要です
      </p>

      {!configured && (
        <p style={{ fontSize: "13px", color: "#fca5a5", marginBottom: "12px" }}>
          Supabase の URL / ANON KEY が未設定です
        </p>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError("");
            setMessage("");
          }}
          style={tabStyle(mode === "login")}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError("");
            setMessage("");
          }}
          style={tabStyle(mode === "signup")}
        >
          新規登録
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          required
          autoComplete="email"
          style={{
            padding: "10px 14px",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード（6文字以上）"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          style={{
            padding: "10px 14px",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={loading || !configured}
          style={{
            padding: "12px",
            background: loading || !configured ? "var(--border)" : "var(--accent)",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: 600,
          }}
        >
          {loading ? "処理中..." : mode === "login" ? "ログイン" : "新規登録する"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "12px", fontSize: "13px", color: "#86efac", lineHeight: 1.6 }}>
          {message}
        </p>
      )}
      {error && (
        <p style={{ marginTop: "12px", fontSize: "13px", color: "#fca5a5", lineHeight: 1.6 }}>
          {error}
        </p>
      )}
    </div>
  );
}
