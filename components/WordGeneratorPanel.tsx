"use client";

import { useState } from "react";
import { DIFFICULTY_OPTIONS, SITUATION_OPTIONS } from "@/lib/types";

interface WordGeneratorPanelProps {
  onWordsGenerated: (
    words: string,
    meta?: { situation: string; difficulty: string }
  ) => void;
  disabled?: boolean;
}

export default function WordGeneratorPanel({
  onWordsGenerated,
  disabled,
}: WordGeneratorPanelProps) {
  const [situation, setSituation] = useState<string>(SITUATION_OPTIONS[0]);
  const [customSituation, setCustomSituation] = useState("");
  const [difficulty, setDifficulty] = useState<string>(DIFFICULTY_OPTIONS[1].value);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveSituation =
    situation === "custom" ? customSituation.trim() : situation;

  const handleGenerate = async () => {
    if (!effectiveSituation) {
      setError("シチュエーションを入力してください");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: effectiveSituation,
          difficulty,
          count,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "単語生成に失敗しました");
      }

      onWordsGenerated(data.words.join("\n"), {
        situation: effectiveSituation,
        difficulty,
      });
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
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "24px",
        marginBottom: "20px",
      }}
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--accent-light)",
          marginBottom: "20px",
        }}
      >
        AIで頻出単語を生成
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <label style={labelStyle}>シチュエーション</label>
          <select
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            disabled={disabled || loading}
            style={fieldStyle}
          >
            {SITUATION_OPTIONS.map((opt) => (
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
              placeholder="例: 海外出張・空港・ホテル"
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
            {DIFFICULTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            単語数: {count}個
          </label>
          <input
            type="range"
            min={5}
            max={30}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={disabled || loading}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            <span>5</span>
            <span>30</span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={disabled || loading}
          style={{
            padding: "14px 24px",
            fontSize: "15px",
            fontWeight: 600,
            background: loading ? "var(--border)" : "var(--success)",
            color: "#fff",
            borderRadius: "var(--radius)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {loading && (
            <span
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          )}
          {loading ? "単語を生成中..." : "Generate Words"}
        </button>

        {error && (
          <p style={{ fontSize: "13px", color: "#fca5a5", textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
