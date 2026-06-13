import { generateJson } from "./gemini";
import { THEME_LIST, getGroupCount } from "./themes";
import type { GenerateResult, ThemeGroup } from "./types";
import { formatTxt } from "./txtFormatter";

interface FullGenerateResponse {
  groups: ThemeGroup[];
}

export async function generateSentences(words: string[]): Promise<GenerateResult> {
  const groupCount = getGroupCount(words.length);
  const themes = THEME_LIST.slice(0, Math.min(groupCount, THEME_LIST.length));

  const prompt = `あなたはTOEIC学習支援の専門家です。以下の英単語を使い、テーマ別にTOEIC 600点レベルのビジネス英語例文を作成してください。

単語リスト: ${words.join(", ")}

使用するテーマ（${themes.length}グループ）:
${themes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## Step1: テーマ別分類
- すべての単語を必ず1つ以上のグループに割り当てる
- 各グループに最低1単語を割り当てる
- 関連性の高い単語を同じグループにまとめる
- グループ数は正確に${themes.length}個

## Step2: 各テーマごとに例文生成
- TOEIC中級レベル（600点前後）のビジネス英語
- 各文は15〜25語程度
- 自然で実用的な英語
- 各文に最低2つの指定単語を使用
- グループ内の全単語を必ずすべて使用する
- 自然な日本語訳も付ける

JSON形式で返答:
{
  "groups": [
    {
      "theme": "テーマ名",
      "words": ["Word1", "Word2"],
      "sentences": [
        {
          "english": "英文",
          "japanese": "日本語訳",
          "wordsUsed": ["使用した単語1", "使用した単語2"]
        }
      ]
    }
  ]
}`;

  const result = await generateJson<FullGenerateResponse>(prompt, 0.5);

  const groups = result.groups.filter((g) => g.words.length > 0 && g.sentences.length > 0);
  const txtContent = formatTxt(groups);
  const totalSentences = groups.reduce((sum, g) => sum + g.sentences.length, 0);

  return {
    groups,
    txtContent,
    totalWords: words.length,
    totalSentences,
  };
}
