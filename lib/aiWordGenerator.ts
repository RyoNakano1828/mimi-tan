import { generateJson } from "./gemini";
import type { WordEntry } from "./types";

interface WordGenerateResponse {
  words: { word: string; japanese: string }[];
}

const DIFFICULTY_GUIDE: Record<string, string> = {
  "400-500": "初級（400〜500点）。基本的な英単語",
  "600": "中級（600点前後）。実用的な英単語",
  "700-800": "上級（700〜800点）。やや高度な英単語",
  beginner: "初級。基本的な日常英単語",
  intermediate: "中級。日常会話でよく使う表現",
  advanced: "上級。自然な日常会話表現",
};

export async function generateWords(
  themes: string[],
  situations: string[] | null,
  difficulty: string,
  count: number
): Promise<WordEntry[]> {
  if (themes.length === 0) {
    throw new Error("テーマを1つ以上選択してください");
  }

  const difficultyGuide =
    DIFFICULTY_GUIDE[difficulty] ?? DIFFICULTY_GUIDE["600"];

  const situationBlock =
    situations && situations.length > 0
      ? `シチュエーション: ${situations.join(", ")}`
      : `シチュエーション: AIがテーマに合った場面を自動で選んでください（例: 会議、空港、レストランなど）`;

  const prompt = `あなたは英語学習教材の専門家です。指定されたテーマとシチュエーションに合った英単語をピックアップしてください。

テーマ（何について学ぶか）: ${themes.join(", ")}
${situationBlock}
難易度: ${difficultyGuide}
単語数: ${count}個

テーマとシチュエーションの関係:
- テーマは生成する英単語の種類・分野を決める
- シチュエーションはその単語が使われる場面のイメージ（例文生成時に参照される）

条件:
- 指定テーマに関連性の高い英単語を選ぶ
- 名詞・動詞・形容詞をバランスよく含める
- 1語のみ（熟語は2語まで可）
- 各単語に自然な日本語訳を付ける
- 重複なし
- 正確に${count}個

JSON形式:
{
  "words": [
    { "word": "agenda", "japanese": "議題" }
  ]
}`;

  const result = await generateJson<WordGenerateResponse>(prompt, 0.5);

  return (result.words ?? []).slice(0, count).map((w) => ({
    word: w.word,
    japanese: w.japanese ?? "",
  }));
}
