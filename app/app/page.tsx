"use client";

import { useState } from "react";
import JapaneseInput from "@/components/JapaneseInput";
import WordGeneratorPanel from "@/components/WordGeneratorPanel";
import ThemeCard from "@/components/ThemeCard";
import StudyMode from "@/components/StudyMode";
import SaveSessionButton from "@/components/SaveSessionButton";
import WordSelector, {
  allWordKeys,
  selectedWordsList,
} from "@/components/WordSelector";
import AuthGuard from "@/components/AuthGuard";
import AppHeader from "@/components/AppHeader";
import type { GenerateResult, WordEntry } from "@/lib/types";

type InputMode = "manual" | "ai";

export default function MainAppPage() {
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [japaneseInput, setJapaneseInput] = useState("");
  const [wordEntries, setWordEntries] = useState<WordEntry[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [themes, setThemes] = useState<string[]>([]);
  const [situations, setSituations] = useState<string[] | null>(null);
  const [difficulty, setDifficulty] = useState<string>();
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [wordsReady, setWordsReady] = useState(false);

  const resetWords = () => {
    setWordEntries([]);
    setSelectedKeys(new Set());
    setWordsReady(false);
    setResult(null);
    setError("");
  };

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    resetWords();
    setJapaneseInput("");
  };

  const handleExtractWords = async () => {
    if (!japaneseInput.trim()) {
      setError("日本語の文章を入力してください");
      return;
    }

    setExtracting(true);
    setError("");
    setResult(null);
    setWordsReady(false);

    try {
      const res = await fetch("/api/extract-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ japaneseText: japaneseInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "単語抽出に失敗しました");

      const entries: WordEntry[] = data.wordEntries;
      setWordEntries(entries);
      setSelectedKeys(allWordKeys(entries));
      setWordsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "単語抽出に失敗しました");
    } finally {
      setExtracting(false);
    }
  };

  const handleAiWordsGenerated = (meta: {
    wordEntries: WordEntry[];
    themes: string[];
    situations: string[] | null;
    difficulty: string;
  }) => {
    setWordEntries(meta.wordEntries);
    setSelectedKeys(allWordKeys(meta.wordEntries));
    setThemes(meta.themes);
    setSituations(meta.situations);
    setDifficulty(meta.difficulty);
    setWordsReady(true);
    setResult(null);
    setError("");
  };

  const handleGenerateSentences = async () => {
    const selected = selectedWordsList(wordEntries, selectedKeys);
    if (selected.length === 0) {
      setError("例文生成に使う単語を1つ以上選択してください");
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
          selectedWords: selected,
          wordEntries,
          sourceJapanese:
            inputMode === "manual" ? japaneseInput.trim() : undefined,
          themes: themes.length > 0 ? themes : undefined,
          situations: situations && situations.length > 0 ? situations : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || extracting;

  return (
    <AuthGuard>
      {(user) => (
        <>
          <AppHeader user={user} active="main" />

          <main className="app-main">
            <header className="app-hero">
              <h1 className="app-hero__title">例文を作成</h1>
              <p className="app-hero__subtitle">
                日本語から英単語を抽出し、意味に近い例文で学習
              </p>
            </header>

            <div className="input-mode-tabs">
              <button
                type="button"
                onClick={() => handleModeChange("manual")}
                className={`input-mode-tab${inputMode === "manual" ? " input-mode-tab--active" : ""}`}
              >
                日本語入力
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("ai")}
                className={`input-mode-tab${inputMode === "ai" ? " input-mode-tab--active" : ""}`}
              >
                AIで単語生成
              </button>
            </div>

            {inputMode === "manual" && (
              <>
                <JapaneseInput
                  value={japaneseInput}
                  onChange={(v) => {
                    setJapaneseInput(v);
                    if (wordsReady) resetWords();
                  }}
                  disabled={busy}
                />
                <div className="app-generate-wrap">
                  <button
                    type="button"
                    onClick={handleExtractWords}
                    disabled={busy}
                    className="app-generate-btn app-generate-btn--secondary"
                  >
                    {extracting && (
                      <span className="auth-spinner auth-spinner--sm" />
                    )}
                    {extracting ? "単語を抽出中..." : "単語を抽出"}
                  </button>
                </div>
              </>
            )}

            {inputMode === "ai" && (
              <WordGeneratorPanel
                onWordsGenerated={handleAiWordsGenerated}
                disabled={busy}
              />
            )}

            {wordsReady && wordEntries.length > 0 && !result && (
              <WordSelector
                entries={wordEntries}
                selectedKeys={selectedKeys}
                onChange={setSelectedKeys}
                disabled={busy}
              />
            )}

            {wordsReady && !result && (
              <div className="app-generate-wrap">
                <button
                  type="button"
                  onClick={handleGenerateSentences}
                  disabled={busy}
                  className="app-generate-btn"
                >
                  {loading && <span className="auth-spinner auth-spinner--sm" />}
                  {loading ? "生成中..." : "例文を生成"}
                </button>
              </div>
            )}

            {error && <p className="app-error">{error}</p>}

            {loading && (
              <div className="app-loading">
                <p>選択した単語で例文を生成しています...</p>
                <p className="app-loading__hint">
                  30秒〜2分ほどかかる場合があります
                </p>
              </div>
            )}

            {result && !loading && (
              <>
                <p className="app-result-summary">
                  {result.totalWords}語 → {result.groups.length}グループ /{" "}
                  {result.totalSentences}例文を生成しました
                </p>

                {result.sourceJapanese && (
                  <blockquote className="source-japanese">
                    <span className="source-japanese__label">元の日本語</span>
                    {result.sourceJapanese}
                  </blockquote>
                )}

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
                    selectedWords={selectedWordsList(wordEntries, selectedKeys)}
                    themes={themes}
                    situations={situations ?? undefined}
                    difficulty={difficulty}
                    sourceJapanese={
                      inputMode === "manual" ? japaneseInput.trim() : undefined
                    }
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
