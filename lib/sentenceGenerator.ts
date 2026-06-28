import { generateJson } from "./gemini";
import { getSentencePlan } from "./themes";
import type { AppStudyMode, GenerateResult, ThemeGroup, WordEntry } from "./types";
import { formatTxt } from "./txtFormatter";

interface FullGenerateResponse {
  groups: ThemeGroup[];
}

export interface GenerateSentencesOptions {
  words: string[];
  wordEntries?: WordEntry[];
  studyMode?: AppStudyMode;
  sourceJapanese?: string;
  sourceEnglishTranslation?: string;
  themes?: string[];
  situations?: string[];
}

function resolveGroupingThemes(
  wordCount: number,
  themes?: string[]
): { groupingThemes: string[]; maxSentences: number } {
  const plan = getSentencePlan(wordCount);
  const groupCount = plan.groups;

  let groupingThemes: string[];
  if (themes && themes.length > 0) {
    groupingThemes = themes.slice(0, Math.min(groupCount, themes.length));
  } else {
    groupingThemes = Array.from(
      { length: groupCount },
      (_, i) => `例文${i + 1}`
    );
  }

  return { groupingThemes, maxSentences: plan.maxSentences };
}

const CASUAL_STYLE = `- カジュアルで短い英文（6〜12語程度、会話調・口語OK）
- 堅いビジネス文より、日常会話に近い自然な言い回し`;

function buildPrompt(options: GenerateSentencesOptions): string {
  const { words, sourceJapanese, sourceEnglishTranslation, themes, situations } =
    options;
  const { groupingThemes, maxSentences } = resolveGroupingThemes(
    words.length,
    themes
  );
  const situationText =
    situations && situations.length > 0
      ? situations.join(", ")
      : "内容に応じて適切な場面";

  const sentenceBudget = `- 例文の合計数は最大${maxSentences}個（これ以上作らない）
- グループ数は正確に${groupingThemes.length}個
- 1グループあたり1〜2文程度に抑える`;

  const englishRef = sourceEnglishTranslation?.trim()
    ? `\n## 参考英訳\n${sourceEnglishTranslation.trim()}`
    : "";

  if (sourceJapanese?.trim()) {
    return `あなたは英語学習支援の専門家です。ユーザーが日本語で書いた文章を英語にする際に使う単語と、短い例文を作成します。

## 元の日本語
${sourceJapanese.trim()}
${englishRef}

## 使用する英単語
${words.join(", ")}

## シチュエーション
${situationText}

## グループ（${groupingThemes.length}個）
${groupingThemes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## 条件
- 例文は元の日本語の意味に近い英語にする
- 指定した英単語をすべて必ず1回以上使用する
${CASUAL_STYLE}
- 各文に自然な日本語訳を付ける
${sentenceBudget}

JSON形式:
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

  return `あなたは英語学習支援の専門家です。以下の英単語を使い、短い例文を作成してください。

## 使用する英単語
${words.join(", ")}

## テーマ（${groupingThemes.length}グループ）
${groupingThemes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## シチュエーション
${situationText}

## 条件
- シチュエーションに合った場面で例文を書く
- 指定した全単語を必ず1回以上使用する
${CASUAL_STYLE}
- 自然な日本語訳も付ける
${sentenceBudget}

JSON形式:
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

function trimToSentenceBudget(
  groups: ThemeGroup[],
  maxSentences: number
): ThemeGroup[] {
  let remaining = maxSentences;
  const trimmed: ThemeGroup[] = [];

  for (const group of groups) {
    if (remaining <= 0) break;
    const sentences = group.sentences.slice(0, remaining);
    if (sentences.length === 0) continue;
    trimmed.push({ ...group, sentences });
    remaining -= sentences.length;
  }

  return trimmed;
}

export async function generateSentences(
  options: GenerateSentencesOptions
): Promise<GenerateResult> {
  const {
    words,
    wordEntries: existingWordEntries,
    studyMode = "toeic",
    sourceJapanese,
    sourceEnglishTranslation,
    themes,
    situations,
  } = options;

  if (words.length === 0) {
    throw new Error("単語が選択されていません");
  }

  const { maxSentences } = getSentencePlan(words.length);
  const prompt = buildPrompt(options);
  const result = await generateJson<FullGenerateResponse>(prompt, 0.5);

  const groups = trimToSentenceBudget(
    result.groups.filter((g) => g.words.length > 0 && g.sentences.length > 0),
    maxSentences
  );
  const txtContent = formatTxt(groups);
  const totalSentences = groups.reduce((sum, g) => sum + g.sentences.length, 0);

  let wordEntries = existingWordEntries ?? [];
  if (wordEntries.length > 0) {
    const map = new Map(
      wordEntries.map((e) => [e.word.trim().toLowerCase(), e.japanese])
    );
    wordEntries = words.map((word) => ({
      word,
      japanese: map.get(word.trim().toLowerCase()) ?? "",
    }));
  } else {
    wordEntries = words.map((word) => ({ word, japanese: "" }));
  }

  return {
    groups,
    wordEntries,
    txtContent,
    totalWords: words.length,
    totalSentences,
    studyMode,
    sourceJapanese: sourceJapanese?.trim() || undefined,
    sourceEnglishTranslation: sourceEnglishTranslation?.trim() || undefined,
    themes: themes?.length ? themes : undefined,
    situations: situations?.length ? situations : undefined,
  };
}
