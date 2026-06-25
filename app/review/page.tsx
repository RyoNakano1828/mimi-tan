"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthPanel from "@/components/AuthPanel";
import { getAccessToken } from "@/lib/authClient";
import ThemeCard from "@/components/ThemeCard";
import StudyMode from "@/components/StudyMode";
import type { SavedSessionDetail, SavedSessionSummary } from "@/lib/types";

export default function ReviewPage() {
  const [sessions, setSessions] = useState<SavedSessionSummary[]>([]);
  const [selected, setSelected] = useState<SavedSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  const fetchSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) {
        setSessions([]);
        return;
      }

      const res = await fetch("/api/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "取得に失敗しました");
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("ログインが必要です");

      const res = await fetch(`/api/sessions?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "取得に失敗しました");
      setSelected(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchSessions();
    else {
      setLoading(false);
      setSessions([]);
    }
  }, [isLoggedIn]);

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--accent-light)" }}>
          復習
        </h1>
        <Link href="/" style={{ fontSize: "14px", color: "var(--accent-light)" }}>
          ← トップへ
        </Link>
      </div>

      <AuthPanel onAuthChange={(user) => setIsLoggedIn(!!user)} />

      {error && (
        <p style={{ color: "#fca5a5", textAlign: "center", marginBottom: "16px" }}>{error}</p>
      )}

      {loading && <p style={{ textAlign: "center", color: "var(--text-muted)" }}>読み込み中...</p>}

      {!loading && isLoggedIn && !selected && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sessions.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)" }}>
              保存されたセッションはありません
            </p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadDetail(s.id)}
                style={{
                  textAlign: "left",
                  padding: "16px 20px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text-primary)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                  {s.title ?? "Untitled"}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {s.total_words}語 / {s.total_sentences}例文 ·{" "}
                  {new Date(s.created_at).toLocaleString("ja-JP")}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {selected && (
        <>
          <button
            onClick={() => setSelected(null)}
            style={{
              marginBottom: "20px",
              padding: "8px 16px",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
            }}
          >
            ← 一覧に戻る
          </button>

          <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>{selected.title}</h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
            {selected.total_words}語 / {selected.total_sentences}例文
            {selected.situation && ` · ${selected.situation}`}
            {selected.difficulty && ` · ${selected.difficulty}`}
          </p>

          {selected.audio_url && (
            <div style={{ marginBottom: "24px" }}>
              <audio controls src={selected.audio_url} style={{ width: "100%" }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
            {selected.groups.map((group, i) => (
              <ThemeCard key={`${selected.id}-${group.theme}`} group={group} index={i} />
            ))}
          </div>

          <StudyMode groups={selected.groups} />
        </>
      )}
    </main>
  );
}
