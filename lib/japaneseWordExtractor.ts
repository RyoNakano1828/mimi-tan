import { generateJson } from "./gemini";
import type { WordEntry } from "./types";

interface ExtractResponse {
  words: { word: string; japanese: string }[];
}

export async function extractWordsFromJapanese(
  japaneseText: string,
  themes?: string[]
): Promise<WordEntry[]> {
  const themeHint =
    themes && themes.length > 0
      ? `\n参考テーマ: ${themes.join(", ")}`
      : "";

  const prompt = `あなたは英語学習支援の専門家です。以下の日本語を英語で言いたいときに必要となる英単語・表現を抽出してください。
「英語でなんていうんだろう？」を解決するための語彙リストを作成します。

日本語:
${japaneseText.trim()}
${themeHint}

条件:
- この日本語を自然な英語に言い換えるのに必要な重要語彙を5〜15個抽出
- 名詞・動詞・形容詞・便利なフレーズを含める
- 各英単語に、上記の日本語文脈での意味がわかる日本語訳を付ける
- 1語または短いフレーズ（2語まで可）
- 重複なし

JSON形式:
{
  "words": [
    { "word": "passport", "japanese": "パスポート" }
  ]
}`;

  const result = await generateJson<ExtractResponse>(prompt, 0.4);

  return (result.words ?? []).map((w) => ({
    word: w.word.trim(),
    japanese: w.japanese ?? "",
  }));
}
