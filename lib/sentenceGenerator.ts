import { generateJson } from "./gemini";
import { getGroupCount, getThemeList } from "./themes";
import type { AppStudyMode, GenerateResult, ThemeGroup } from "./types";
import { formatTxt } from "./txtFormatter";
import { fetchWordTranslations } from "./wordTranslator";

interface FullGenerateResponse {
  groups: ThemeGroup[];
}

function buildPrompt(
  words: string[],
  themes: readonly string[],
  studyMode: AppStudyMode
): string {
  if (studyMode === "daily") {
    return `あなたは英語学習支援の専門家です。以下の英単語を使い、テーマ別に日常会話レベルの自然な英語例文を作成してください。

単語リスト: ${words.join(", ")}

使用するテーマ（${themes.length}グループ）:
${themes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## Step1: テーマ別分類
- すべての単語を必ず1つ以上のグループに割り当てる
- 各グループに最低1単語を割り当てる
- 関連性の高い単語を同じグループにまとめる
- グループ数は正確に${themes.length}個

## Step2: 各テーマごとに例文生成
- 日常会話で使える自然な英語（カジュアル〜やや丁寧）
- 各文は10〜20語程度
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
  }

  return `あなたはTOEIC学習支援の専門家です。以下の英単語を使い、テーマ別にTOEIC 600点レベルのビジネス英語例文を作成してください。

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
}

export async function generateSentences(
  words: string[],
  studyMode: AppStudyMode = "toeic",
  existingWordEntries?: { word: string; japanese: string }[]
): Promise<GenerateResult> {
  const groupCount = getGroupCount(words.length);
  const themeList = getThemeList(studyMode);
  const themes = themeList.slice(0, Math.min(groupCount, themeList.length));

  const prompt = buildPrompt(words, themes, studyMode);
  const result = await generateJson<FullGenerateResponse>(prompt, 0.5);

  const groups = result.groups.filter(
    (g) => g.words.length > 0 && g.sentences.length > 0
  );
  const txtContent = formatTxt(groups);
  const totalSentences = groups.reduce((sum, g) => sum + g.sentences.length, 0);

  let wordEntries = existingWordEntries ?? [];
  if (wordEntries.length === 0) {
    wordEntries = await fetchWordTranslations(words, studyMode);
  } else {
    const map = new Map(
      wordEntries.map((e) => [e.word.trim().toLowerCase(), e.japanese])
    );
    wordEntries = words.map((word) => ({
      word,
      japanese: map.get(word.trim().toLowerCase()) ?? "",
    }));
  }

  return {
    groups,
    wordEntries,
    txtContent,
    totalWords: words.length,
    totalSentences,
    studyMode,
  };
}
