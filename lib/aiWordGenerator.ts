import { generateJson } from "./gemini";

interface WordGenerateResponse {
  words: string[];
}

const DIFFICULTY_GUIDE: Record<string, string> = {
  "400-500": "TOEIC 400〜500点レベル。基本的なビジネス英単語（agree, meeting, report など）",
  "600": "TOEIC 600点前后レベル。実務でよく使う中級ビジネス英単語（negotiate, deadline, budget など）",
  "700-800": "TOEIC 700〜800点レベル。やや高度なビジネス英単語（compliance, procurement, stakeholder など）",
};

export async function generateWords(
  situation: string,
  difficulty: string,
  count: number
): Promise<string[]> {
  const difficultyGuide =
    DIFFICULTY_GUIDE[difficulty] ?? DIFFICULTY_GUIDE["600"];

  const prompt = `あなたはTOEIC学習教材の専門家です。指定されたシチュエーションと難易度に合った、TOEICで頻出するビジネス英単語をピックアップしてください。

シチュエーション: ${situation}
難易度: ${difficultyGuide}
単語数: ${count}個

条件:
- TOEIC Part 5/6/7 で実際に出題されやすいビジネス英単語を選ぶ
- 指定シチュエーションに関連性の高い単語を優先
- 名詞・動詞・形容詞をバランスよく含める
- 1語のみ（熟語は2語まで可、例: "due date"）
- 重複なし
- 正確に${count}個

JSON形式で返答:
{
  "words": ["Word1", "Word2", "Word3"]
}`;

  const result = await generateJson<WordGenerateResponse>(prompt, 0.5);
  return result.words.slice(0, count);
}
