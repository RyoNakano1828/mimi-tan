"use client";

import { useState } from "react";
import WordInput from "@/components/WordInput";
import WordGeneratorPanel from "@/components/WordGeneratorPanel";
import ThemeCard from "@/components/ThemeCard";
import DownloadSection from "@/components/DownloadSection";
import StudyMode from "@/components/StudyMode";
import SaveSessionButton from "@/components/SaveSessionButton";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import type { GenerateResult } from "@/lib/types";

type InputMode = "manual" | "ai";

export default function MainAppPage() {
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [input, setInput] = useState("");
  const [situation, setSituation] = useState<string>();
  const [difficulty, setDifficulty] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError("単語を入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成に失敗しました");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      {(user) => (
        <>
          <AppHeader user={user} active="main" />

          <main className="app-main">
            <header className="app-hero">
              <h1 className="app-hero__title">例文を作成</h1>
              <p className="app-hero__subtitle">
                単語リストから TOEIC 向け例文を自動生成
              </p>
            </header>

            <div className="input-mode-tabs">
              <button
                type="button"
                onClick={() => setInputMode("manual")}
                className={`input-mode-tab${inputMode === "manual" ? " input-mode-tab--active" : ""}`}
              >
                手入力
              </button>
              <button
                type="button"
                onClick={() => setInputMode("ai")}
                className={`input-mode-tab${inputMode === "ai" ? " input-mode-tab--active" : ""}`}
              >
                AIで単語生成
              </button>
            </div>

            {inputMode === "ai" && (
              <WordGeneratorPanel
                onWordsGenerated={(words, meta) => {
                  setInput(words);
                  setSituation(meta?.situation);
                  setDifficulty(meta?.difficulty);
                }}
                disabled={loading}
              />
            )}

            <section className="app-section">
              <WordInput value={input} onChange={setInput} disabled={loading} />
            </section>

            <div className="app-generate-wrap">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="app-generate-btn"
              >
                {loading && <span className="auth-spinner auth-spinner--sm" />}
                {loading ? "生成中..." : "例文を生成"}
              </button>
            </div>

            {error && <p className="app-error">{error}</p>}

            {loading && (
              <div className="app-loading">
                <p>単語をテーマ別に分類し、例文を生成しています...</p>
                <p className="app-loading__hint">
                  30秒〜2分ほどかかる場合があります
                </p>
              </div>
            )}

            {result && !loading && (
              <>
                <p className="app-result-summary">
                  {result.totalWords}語 → {result.groups.length}テーマ /{" "}
                  {result.totalSentences}例文を生成しました
                </p>

                <div className="app-result-groups">
                  {result.groups.map((group, i) => (
                    <ThemeCard key={group.theme} group={group} index={i} />
                  ))}
                </div>

                <StudyMode groups={result.groups} />

                <div className="app-download-wrap">
                  <DownloadSection txtContent={result.txtContent} />
                </div>

                <div className="app-save-wrap">
                  <SaveSessionButton
                    result={result}
                    wordsInput={input}
                    situation={situation}
                    difficulty={difficulty}
                    isLoggedIn
                  />
                </div>
              </>
            )}
          </main>
        </>
      )}
    </AuthGuard>
  );
}
