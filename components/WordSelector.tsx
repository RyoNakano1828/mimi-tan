"use client";

import type { WordEntry } from "@/lib/types";

export function wordKey(word: string): string {
  return word.trim().toLowerCase();
}

interface WordSelectorProps {
  entries: WordEntry[];
  selectedKeys: Set<string>;
  onChange: (keys: Set<string>) => void;
  disabled?: boolean;
}

export default function WordSelector({
  entries,
  selectedKeys,
  onChange,
  disabled,
}: WordSelectorProps) {
  if (entries.length === 0) return null;

  const toggle = (key: string) => {
    if (disabled) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      if (next.size <= 1) return;
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
  };

  const selectAll = () => {
    onChange(new Set(entries.map((e) => wordKey(e.word))));
  };

  const selectedCount = entries.filter((e) =>
    selectedKeys.has(wordKey(e.word))
  ).length;

  return (
    <div className="word-selector">
      <div className="word-selector__header">
        <h3 className="word-selector__title">例文に使う単語を選択</h3>
        <span className="word-selector__count">
          {selectedCount} / {entries.length} 語
        </span>
      </div>
      <p className="word-selector__hint">
        タップで選択/解除（グレーアウト = 未使用）。デフォルトは全選択です。
      </p>
      <div className="word-selector__grid">
        {entries.map((entry) => {
          const key = wordKey(entry.word);
          const isSelected = selectedKeys.has(key);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(key)}
              className={`word-selector__card${isSelected ? "" : " word-selector__card--off"}`}
            >
              <span className="word-selector__word">{entry.word}</span>
              {entry.japanese && (
                <span className="word-selector__ja">{entry.japanese}</span>
              )}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="word-selector__all"
        onClick={selectAll}
        disabled={disabled || selectedCount === entries.length}
      >
        すべて選択
      </button>
    </div>
  );
}

export function allWordKeys(entries: WordEntry[]): Set<string> {
  return new Set(entries.map((e) => wordKey(e.word)));
}

export function selectedWordEntries(
  entries: WordEntry[],
  keys: Set<string>
): WordEntry[] {
  return entries.filter((e) => keys.has(wordKey(e.word)));
}

export function selectedWordsList(
  entries: WordEntry[],
  keys: Set<string>
): string[] {
  return selectedWordEntries(entries, keys).map((e) => e.word);
}
