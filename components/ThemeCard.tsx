"use client";

import type { ThemeGroup } from "@/lib/types";

interface ThemeCardProps {
  group: ThemeGroup;
  index: number;
}

export default function ThemeCard({ group, index }: ThemeCardProps) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "24px",
        boxShadow: "var(--shadow)",
        animation: `fadeIn 0.4s ease ${index * 0.1}s both`,
      }}
    >
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "var(--accent-light)",
          marginBottom: "8px",
          borderBottom: "2px solid var(--accent)",
          paddingBottom: "8px",
        }}
      >
        # {group.theme}
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "20px",
        }}
      >
        {group.words.map((word) => (
          <span
            key={word}
            style={{
              fontSize: "12px",
              padding: "3px 10px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "var(--accent-light)",
              borderRadius: "20px",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {group.sentences.map((sentence, i) => (
        <div
          key={i}
          style={{
            marginBottom: i < group.sentences.length - 1 ? "24px" : 0,
            paddingBottom: i < group.sentences.length - 1 ? "24px" : 0,
            borderBottom:
              i < group.sentences.length - 1
                ? "1px solid var(--border)"
                : "none",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            {i + 1}.
          </div>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.8,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            {sentence.english}
          </p>
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
            }}
          >
            {sentence.japanese}
          </p>
        </div>
      ))}
    </div>
  );
}
