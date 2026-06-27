import { generateJson } from "./gemini";
import type { AppStudyMode, WordEntry } from "./types";

interface TranslationResponse {
  entries: { word: string; japanese: string }[];
}

export async function fetchWordTranslations(
  words: string[],
  studyMode: AppStudyMode
): Promise<WordEntry[]> {
  if (words.length === 0) return [];

  const context =
    studyMode === "daily"
      ? "日常会話で使われる英単語・表現"
      : "TOEIC・ビジネス英語の単語";

  const prompt = `以下の英単語それぞれに、${context}として自然な日本語訳を付けてください。

単語リスト: ${words.join(", ")}

条件:
- 各単語に1つの代表的な日本語訳
- 文脈に応じた一般的な訳語
- 入力した単語と同じ順序・表記で返す

JSON形式:
{
  "entries": [
    { "word": "Accept", "japanese": "受け入れる" }
  ]
}`;

  const result = await generateJson<TranslationResponse>(prompt, 0.3);

  const map = new Map<string, string>();
  for (const e of result.entries ?? []) {
    map.set(e.word.trim().toLowerCase(), e.japanese);
  }

  return words.map((word) => ({
    word,
    japanese: map.get(word.trim().toLowerCase()) ?? "",
  }));
}
