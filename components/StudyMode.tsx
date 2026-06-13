"use client";

import { useState } from "react";
import type { ThemeGroup } from "@/lib/types";

interface StudyModeProps {
  groups: ThemeGroup[];
}

interface StudyCard {
  theme: string;
  english: string;
  japanese: string;
}

export default function StudyMode({ groups }: StudyModeProps) {
  const cards: StudyCard[] = groups.flatMap((g) =>
    g.sentences.map((s) => ({
      theme: g.theme,
      english: s.english,
      japanese: s.japanese,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showJapanese, setShowJapanese] = useState(false);
  const [studied, setStudied] = useState<Set<number>>(new Set());

  if (cards.length === 0) return null;

  const card = cards[currentIndex];
  const progress = Math.round((studied.size / cards.length) * 100);

  const next = () => {
    setStudied((prev) => new Set(prev).add(currentIndex));
    setShowJapanese(false);
    setCurrentIndex((i) => (i + 1) % cards.length);
  };

  const prev = () => {
    setShowJapanese(false);
    setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "28px",
        marginTop: "32px",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent-light)" }}>
          学習モード
        </h3>
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {currentIndex + 1} / {cards.length}（学習済み {progress}%）
        </span>
      </div>

      <div
        style={{
          height: "4px",
          background: "var(--border)",
          borderRadius: "2px",
          marginBottom: "24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--success)",
            transition: "width 0.3s",
            borderRadius: "2px",
          }}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "32px 16px",
          minHeight: "180px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "12px",
          }}
        >
          {card.theme}
        </span>
        <p
          style={{
            fontSize: "17px",
            lineHeight: 1.8,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          {card.english}
        </p>
        {showJapanese && (
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {card.japanese}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={prev}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            background: "var(--bg-input)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        >
          前へ
        </button>
        <button
          onClick={() => setShowJapanese(!showJapanese)}
          style={{
            padding: "10px 28px",
            fontSize: "14px",
            fontWeight: 600,
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "8px",
          }}
        >
          {showJapanese ? "英文のみ" : "訳を表示"}
        </button>
        <button
          onClick={next}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            background: "var(--bg-input)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
        >
          次へ
        </button>
      </div>
    </div>
  );
}
