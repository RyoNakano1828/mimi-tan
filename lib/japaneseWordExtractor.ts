import { generateJson } from "./gemini";
import type { WordEntry } from "./types";

interface ExtractResponse {
  englishTranslation: string;
  words: { word: string; japanese: string }[];
}

export interface JapaneseExtractResult {
  englishTranslation: string;
  wordEntries: WordEntry[];
}

export async function extractWordsFromJapanese(
  japaneseText: string,
  themes?: string[]
): Promise<JapaneseExtractResult> {
  const themeHint =
    themes && themes.length > 0
      ? `\n参考テーマ: ${themes.join(", ")}`
      : "";

  const prompt = `あなたは英語学習支援の専門家です。以下の日本語について、(1)自然な英訳、(2)英語にするときに必要な語彙リストを作成してください。

日本語:
${japaneseText.trim()}
${themeHint}

## 英訳 (englishTranslation)
- カジュアルで自然な英語に訳す（会話調OK）
- 元の意味を忠実に伝える
- 1〜3文程度

## 語彙リスト (words)
- この日本語を英語で言うのに必要な重要語彙を5〜15個
- 各英単語に、上記文脈での意味がわかる日本語訳を付ける
- 1語または短いフレーズ（2語まで）
- 重複なし

JSON形式:
{
  "englishTranslation": "Could I see your passport, please?",
  "words": [
    { "word": "passport", "japanese": "パスポート" }
  ]
}`;

  const result = await generateJson<ExtractResponse>(prompt, 0.4);

  const wordEntries = (result.words ?? []).map((w) => ({
    word: w.word.trim(),
    japanese: w.japanese ?? "",
  }));

  return {
    englishTranslation: result.englishTranslation?.trim() ?? "",
    wordEntries,
  };
}
