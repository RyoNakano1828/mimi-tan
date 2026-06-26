"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import { getAccessToken } from "@/lib/authClient";
import ThemeCard from "@/components/ThemeCard";
import StudyMode from "@/components/StudyMode";
import type { SavedSessionDetail, SavedSessionSummary } from "@/lib/types";

export default function ReviewPage() {
  const [sessions, setSessions] = useState<SavedSessionSummary[]>([]);
  const [selected, setSelected] = useState<SavedSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <AuthGuard>
      {(user) => (
        <ReviewContent
          user={user}
          sessions={sessions}
          selected={selected}
          loading={loading}
          error={error}
          setSelected={setSelected}
          loadDetail={loadDetail}
          fetchSessions={fetchSessions}
        />
      )}
    </AuthGuard>
  );
}

import type { User } from "@supabase/supabase-js";

function ReviewContent({
  user,
  sessions,
  selected,
  loading,
  error,
  setSelected,
  loadDetail,
  fetchSessions,
}: {
  user: User;
  sessions: SavedSessionSummary[];
  selected: SavedSessionDetail | null;
  loading: boolean;
  error: string;
  setSelected: (v: SavedSessionDetail | null) => void;
  loadDetail: (id: string) => void;
  fetchSessions: () => void;
}) {
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AppHeader user={user} active="review" />

      <main className="app-main">
        <header className="app-hero">
          <h1 className="app-hero__title">復習</h1>
          <p className="app-hero__subtitle">保存した例文セッションを確認</p>
        </header>

        {error && <p className="app-error">{error}</p>}

        {loading && !selected && (
          <p className="app-loading-text">読み込み中...</p>
        )}

        {!loading && !selected && (
          <div className="review-list">
            {sessions.length === 0 ? (
              <div className="review-empty">
                <p>保存されたセッションはありません</p>
                <Link href="/app" className="auth-link">
                  例文を作成する →
                </Link>
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadDetail(s.id)}
                  className="review-item"
                >
                  <div className="review-item__title">
                    {s.title ?? "Untitled"}
                  </div>
                  <div className="review-item__meta">
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
              type="button"
              onClick={() => setSelected(null)}
              className="review-back"
            >
              ← 一覧に戻る
            </button>

            <h2 className="review-detail-title">{selected.title}</h2>
            <p className="review-detail-meta">
              {selected.total_words}語 / {selected.total_sentences}例文
              {selected.situation && ` · ${selected.situation}`}
              {selected.difficulty && ` · ${selected.difficulty}`}
            </p>

            {selected.audio_url && (
              <div className="review-audio">
                <audio controls src={selected.audio_url} style={{ width: "100%" }} />
              </div>
            )}

            <div className="app-result-groups">
              {selected.groups.map((group, i) => (
                <ThemeCard
                  key={`${selected.id}-${group.theme}`}
                  group={group}
                  index={i}
                />
              ))}
            </div>

            <StudyMode groups={selected.groups} />
          </>
        )}
      </main>
    </>
  );
}
