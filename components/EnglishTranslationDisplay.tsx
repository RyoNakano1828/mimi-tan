"use client";

interface EnglishTranslationDisplayProps {
  english: string;
  japanese?: string;
}

export default function EnglishTranslationDisplay({
  english,
  japanese,
}: EnglishTranslationDisplayProps) {
  if (!english.trim()) return null;

  return (
    <div className="english-translation">
      <span className="english-translation__label">英訳</span>
      <p className="english-translation__text">{english}</p>
      {japanese && (
        <p className="english-translation__source">{japanese}</p>
      )}
    </div>
  );
}
