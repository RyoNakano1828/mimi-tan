"use client";

import type { WordEntry } from "@/lib/types";

interface WordListDisplayProps {
  entries: WordEntry[];
  title?: string;
  compact?: boolean;
}

export default function WordListDisplay({
  entries,
  title = "単語リスト",
  compact = false,
}: WordListDisplayProps) {
  if (entries.length === 0) return null;

  return (
    <div className={`word-list${compact ? " word-list--compact" : ""}`}>
      <h3 className="word-list__title">{title}</h3>
      <ul className="word-list__items">
        {entries.map((entry) => (
          <li key={entry.word} className="word-list__item">
            <span className="word-list__word">{entry.word}</span>
            {entry.japanese && (
              <span className="word-list__japanese">{entry.japanese}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
