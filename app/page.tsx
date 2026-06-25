"use client";

import { useState } from "react";
import WordInput from "@/components/WordInput";
import WordGeneratorPanel from "@/components/WordGeneratorPanel";
import ThemeCard from "@/components/ThemeCard";
import DownloadSection from "@/components/DownloadSection";
import StudyMode from "@/components/StudyMode";
import type { GenerateResult } from "@/lib/types";

type InputMode = "manual" | "ai";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("manual");
  const [input, setInput] = useState("");
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 600,
    background: active ? "var(--accent)" : "var(--bg-input)",
    color: active ? "#fff" : "var(--text-secondary)",
    border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
    borderRadius: "var(--radius)",
    transition: "all 0.2s",
  });

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "48px 20px 80px",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 800,
            background: "linear-gradient(135deg, #60a5fa, #3b82f6, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          TOEIC Sentence Builder
        </h1>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>
          単語リストからTOEIC向け例文を自動生成
        </p>
      </header>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={() => setInputMode("manual")}
          style={tabStyle(inputMode === "manual")}
        >
          手入力
        </button>
        <button
          type="button"
          onClick={() => setInputMode("ai")}
          style={tabStyle(inputMode === "ai")}
        >
          AIで単語生成
        </button>
      </div>

      {inputMode === "ai" && (
        <WordGeneratorPanel
          onWordsGenerated={setInput}
          disabled={loading}
        />
      )}

      <section style={{ marginBottom: "24px" }}>
        <WordInput value={input} onChange={setInput} disabled={loading} />
      </section>

      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "16px 48px",
            fontSize: "16px",
            fontWeight: 700,
            background: loading ? "var(--border)" : "var(--accent)",
            color: "#fff",
            borderRadius: "var(--radius)",
            transition: "all 0.2s",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            minWidth: "220px",
            justifyContent: "center",
          }}
        >
          {loading && (
            <span
              style={{
                width: "18px",
                height: "18px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                display: "inline-block",
              }}
            />
          )}
          {loading ? "生成中..." : "Generate Sentences"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius)",
            color: "#fca5a5",
            marginBottom: "24px",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            color: "var(--text-muted)",
            animation: "pulse 1.5s ease infinite",
          }}
        >
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>
            単語をテーマ別に分類し、例文を生成しています...
          </p>
          <p style={{ fontSize: "13px" }}>30秒〜2分ほどかかる場合があります</p>
        </div>
      )}

      {result && !loading && (
        <>
          <div
            style={{
              textAlign: "center",
              marginBottom: "24px",
              fontSize: "14px",
              color: "var(--text-muted)",
            }}
          >
            {result.totalWords}語 → {result.groups.length}テーマ /{" "}
            {result.totalSentences}例文を生成しました
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {result.groups.map((group, i) => (
              <ThemeCard key={group.theme} group={group} index={i} />
            ))}
          </div>

          <StudyMode groups={result.groups} />

          <DownloadSection txtContent={result.txtContent} />
        </>
      )}
    </main>
  );
}
