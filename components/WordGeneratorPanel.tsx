"use client";

import { useState } from "react";
import ThemeSituationPicker from "@/components/ThemeSituationPicker";
import { DIFFICULTY_OPTIONS } from "@/lib/types";
import type { WordEntry } from "@/lib/types";

interface WordGeneratorPanelProps {
  onWordsGenerated: (meta: {
    wordEntries: WordEntry[];
    themes: string[];
    situations: string[] | null;
    difficulty: string;
  }) => void;
  disabled?: boolean;
}

export default function WordGeneratorPanel({
  onWordsGenerated,
  disabled,
}: WordGeneratorPanelProps) {
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedSituations, setSelectedSituations] = useState<string[]>([]);
  const [situationAuto, setSituationAuto] = useState(true);
  const [difficulty, setDifficulty] = useState<string>(DIFFICULTY_OPTIONS[1].value);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (selectedThemes.length === 0) {
      setError("テーマを1つ以上選択してください");
      return;
    }

    if (!situationAuto && selectedSituations.length === 0) {
      setError("シチュエーションを選択するか「おまかせ」をオンにしてください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themes: selectedThemes,
          situations: situationAuto ? [] : selectedSituations,
          situationAuto,
          difficulty,
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "単語生成に失敗しました");
      }

      const entries: WordEntry[] = data.words;
      onWordsGenerated({
        wordEntries: entries,
        themes: selectedThemes,
        situations: situationAuto ? null : selectedSituations,
        difficulty,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "単語生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="word-gen-panel">
      <h2 className="word-gen-panel__title">AIで単語を生成</h2>

      <ThemeSituationPicker
        selectedThemes={selectedThemes}
        onThemesChange={setSelectedThemes}
        selectedSituations={selectedSituations}
        onSituationsChange={setSelectedSituations}
        situationAuto={situationAuto}
        onSituationAutoChange={setSituationAuto}
        disabled={disabled || loading}
      />

      <div className="word-gen-panel__fields">
        <div>
          <label className="word-gen-panel__label">難易度</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={disabled || loading}
            className="word-gen-panel__select"
          >
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="word-gen-panel__label">単語数: {count}個</label>
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
    </div>
  );
}
