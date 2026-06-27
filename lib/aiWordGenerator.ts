import { generateJson } from "./gemini";
import type { AppStudyMode, WordEntry } from "./types";

interface WordGenerateResponse {
  words: { word: string; japanese: string }[];
}

const TOEIC_DIFFICULTY_GUIDE: Record<string, string> = {
  "400-500":
    "TOEIC 400〜500点レベル。基本的なビジネス英単語（agree, meeting, report など）",
  "600":
    "TOEIC 600点前后レベル。実務でよく使う中級ビジネス英単語（negotiate, deadline, budget など）",
  "700-800":
    "TOEIC 700〜800点レベル。やや高度なビジネス英単語（compliance, procurement, stakeholder など）",
};

const DAILY_DIFFICULTY_GUIDE: Record<string, string> = {
  beginner: "初級。基本的な日常英単語（buy, eat, happy など）",
  intermediate:
    "中級。日常会話でよく使う表現（appointment, recommend, convenient など）",
  advanced:
    "上級。自然な日常会話表現（figure out, hang out, catch up など）",
};

export async function generateWords(
  situation: string,
  difficulty: string,
  count: number,
  studyMode: AppStudyMode = "toeic"
): Promise<WordEntry[]> {
  const isDaily = studyMode === "daily";
  const difficultyGuide = isDaily
    ? (DAILY_DIFFICULTY_GUIDE[difficulty] ?? DAILY_DIFFICULTY_GUIDE.intermediate)
    : (TOEIC_DIFFICULTY_GUIDE[difficulty] ?? TOEIC_DIFFICULTY_GUIDE["600"]);

  const context = isDaily
    ? "日常会話で使われる英単語"
    : "TOEICで頻出するビジネス英単語";

  const prompt = `あなたは英語学習教材の専門家です。指定されたシチュエーションと難易度に合った、${context}をピックアップしてください。

シチュエーション: ${situation}
難易度: ${difficultyGuide}
単語数: ${count}個

条件:
- ${isDaily ? "日常会話で実際に使える自然な英単語" : "TOEIC Part 5/6/7 で実際に出題されやすいビジネス英単語"}を選ぶ
- 指定シチュエーションに関連性の高い単語を優先
- 名詞・動詞・形容詞をバランスよく含める
- 1語のみ（熟語は2語まで可、例: "due date"）
- 各単語に自然な日本語訳を付ける
- 重複なし
- 正確に${count}個

JSON形式で返答:
{
  "words": [
    { "word": "Word1", "japanese": "日本語訳1" }
  ]
}`;

  const result = await generateJson<WordGenerateResponse>(prompt, 0.5);

  return (result.words ?? []).slice(0, count).map((w) => ({
    word: w.word,
    japanese: w.japanese ?? "",
  }));
}
