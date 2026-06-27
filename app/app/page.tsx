"use client";

import { useState } from "react";
import WordInput from "@/components/WordInput";
import WordGeneratorPanel from "@/components/WordGeneratorPanel";
import ThemeCard from "@/components/ThemeCard";
import StudyMode from "@/components/StudyMode";
import SaveSessionButton from "@/components/SaveSessionButton";
import StudyModeSelector from "@/components/StudyModeSelector";
import WordListDisplay from "@/components/WordListDisplay";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import type { AppStudyMode, GenerateResult, WordEntry } from "@/lib/types";

type InputMode = "manual" | "ai";

export default function MainAppPage() {
  const [studyMode, setStudyMode] = useState<AppStudyMode>("toeic");
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [input, setInput] = useState("");
  const [wordEntries, setWordEntries] = useState<WordEntry[]>([]);
  const [situation, setSituation] = useState<string>();
  const [difficulty, setDifficulty] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);

  const handleStudyModeChange = (mode: AppStudyMode) => {
    setStudyMode(mode);
    setResult(null);
    setWordEntries([]);
    setError("");
  };

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
        body: JSON.stringify({
          words: input,
          studyMode,
          wordEntries: wordEntries.length > 0 ? wordEntries : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成に失敗しました");
      }

      setResult(data);
      setWordEntries(data.wordEntries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const displayEntries = result?.wordEntries ?? wordEntries;

  return (
    <AuthGuard>
      {(user) => (
        <>
          <AppHeader user={user} active="main" />

          <main className="app-main">
            <header className="app-hero">
              <h1 className="app-hero__title">例文を作成</h1>
              <p className="app-hero__subtitle">
                単語リストから例文を自動生成
              </p>
            </header>

            <StudyModeSelector
              value={studyMode}
              onChange={handleStudyModeChange}
              disabled={loading}
            />

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
                studyMode={studyMode}
                onWordsGenerated={(words, meta) => {
                  setInput(words);
                  setSituation(meta?.situation);
                  setDifficulty(meta?.difficulty);
                  setWordEntries(meta?.wordEntries ?? []);
                  setResult(null);
                }}
                disabled={loading}
              />
            )}

            <section className="app-section">
              <WordInput value={input} onChange={setInput} disabled={loading} />
            </section>

            {inputMode === "manual" && displayEntries.length > 0 && !result && (
              <WordListDisplay entries={displayEntries} />
            )}

            <div className="app-generate-wrap">
              <button
                type="button"
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
                <WordListDisplay entries={result.wordEntries} />

                <p className="app-result-summary">
                  {result.totalWords}語 → {result.groups.length}テーマ /{" "}
                  {result.totalSentences}例文を生成しました
                </p>

                <div className="app-result-groups">
                  {result.groups.map((group, i) => (
                    <ThemeCard
                      key={group.theme}
                      group={group}
                      index={i}
                      wordEntries={result.wordEntries}
                    />
                  ))}
                </div>

                <StudyMode groups={result.groups} />

                <div className="app-save-wrap">
                  <SaveSessionButton
                    result={result}
                    wordsInput={input}
                    situation={situation}
                    difficulty={difficulty}
                    studyMode={studyMode}
                    wordEntries={result.wordEntries}
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
