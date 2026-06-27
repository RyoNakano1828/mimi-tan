"use client";

import { useEffect, useState } from "react";
import {
  DIFFICULTY_OPTIONS,
  DAILY_DIFFICULTY_OPTIONS,
  DAILY_SITUATION_OPTIONS,
  SITUATION_OPTIONS,
  type AppStudyMode,
  type WordEntry,
} from "@/lib/types";
import WordListDisplay from "@/components/WordListDisplay";

interface WordGeneratorPanelProps {
  studyMode: AppStudyMode;
  onWordsGenerated: (
    words: string,
    meta?: {
      situation: string;
      difficulty: string;
      wordEntries: WordEntry[];
    }
  ) => void;
  disabled?: boolean;
}

export default function WordGeneratorPanel({
  studyMode,
  onWordsGenerated,
  disabled,
}: WordGeneratorPanelProps) {
  const isDaily = studyMode === "daily";
  const situationOptions = isDaily ? DAILY_SITUATION_OPTIONS : SITUATION_OPTIONS;
  const difficultyOptions = isDaily
    ? DAILY_DIFFICULTY_OPTIONS
    : DIFFICULTY_OPTIONS;

  const [situation, setSituation] = useState<string>(situationOptions[0]);
  const [customSituation, setCustomSituation] = useState("");
  const [difficulty, setDifficulty] = useState<string>(
    difficultyOptions[1]?.value ?? difficultyOptions[0].value
  );
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedEntries, setGeneratedEntries] = useState<WordEntry[]>([]);

  useEffect(() => {
    setSituation(situationOptions[0]);
    setCustomSituation("");
    setDifficulty(difficultyOptions[1]?.value ?? difficultyOptions[0].value);
    setGeneratedEntries([]);
    setError("");
  }, [studyMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveSituation =
    situation === "custom" ? customSituation.trim() : situation;

  const handleGenerate = async () => {
    if (!effectiveSituation) {
      setError("シチュエーションを入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedEntries([]);

    try {
      const res = await fetch("/api/generate-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: effectiveSituation,
          difficulty,
          count,
          studyMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "単語生成に失敗しました");
      }

      const entries: WordEntry[] = data.words;
      setGeneratedEntries(entries);
      onWordsGenerated(
        entries.map((e) => e.word).join("\n"),
        {
          situation: effectiveSituation,
          difficulty,
          wordEntries: entries,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "単語生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    border: "2px solid var(--border)",
    borderRadius: "var(--radius)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: "8px",
  };

  return (
    <div className="word-gen-panel">
      <h2 className="word-gen-panel__title">AIで単語を生成</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <label style={labelStyle}>シチュエーション</label>
          <select
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            disabled={disabled || loading}
            style={fieldStyle}
          >
            {situationOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="custom">その他（自由入力）</option>
          </select>
          {situation === "custom" && (
            <input
              type="text"
              value={customSituation}
              onChange={(e) => setCustomSituation(e.target.value)}
              placeholder={
                isDaily ? "例: ペット・動物" : "例: 海外出張・空港・ホテル"
              }
              disabled={disabled || loading}
              style={{ ...fieldStyle, marginTop: "10px" }}
            />
          )}
        </div>

        <div>
          <label style={labelStyle}>難易度</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={disabled || loading}
            style={fieldStyle}
          >
            {difficultyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>単語数: {count}個</label>
          <input
            type="range"
            min={5}
            max={30}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={disabled || loading}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
          <div className="word-gen-panel__range-labels">
            <span>5</span>
            <span>30</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled || loading}
          className="word-gen-panel__btn"
        >
          {loading && <span className="auth-spinner auth-spinner--sm" />}
          {loading ? "単語を生成中..." : "単語を生成"}
        </button>

        {error && <p className="word-gen-panel__error">{error}</p>}
      </div>

      {generatedEntries.length > 0 && (
        <WordListDisplay entries={generatedEntries} title="生成された単語" />
      )}
    </div>
  );
}
