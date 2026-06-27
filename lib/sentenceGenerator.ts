import { generateJson } from "./gemini";
import { getGroupCount } from "./themes";
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
  themes?: string[];
  situations?: string[];
}

function resolveGroupingThemes(
  words: string[],
  themes?: string[]
): string[] {
  const groupCount = getGroupCount(words.length);
  if (themes && themes.length > 0) {
    return themes.slice(0, Math.min(groupCount, themes.length));
  }
  return ["例文グループ1", "例文グループ2"].slice(
    0,
    Math.min(groupCount, 2)
  );
}

function buildPrompt(options: GenerateSentencesOptions): string {
  const { words, sourceJapanese, themes, situations } = options;
  const groupingThemes = resolveGroupingThemes(words, themes);
  const situationText =
    situations && situations.length > 0
      ? situations.join(", ")
      : "内容に応じて適切な場面";

  if (sourceJapanese?.trim()) {
    return `あなたは英語学習支援の専門家です。ユーザーが日本語で書いた文章を英語にする際に使う単語と例文を作成します。
「英語でなんていうんだろう？」を解決しつつ、必要な単語を例文と一緒に覚えられるようにしてください。

## 元の日本語
${sourceJapanese.trim()}

## 使用する英単語
${words.join(", ")}

## シチュエーション（例文の場面）
${situationText}

## グループ分け用テーマ（${groupingThemes.length}グループ）
${groupingThemes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## 条件
- 例文の英語は、元の日本語の意味・ニュアンスにできるだけ近い表現にする
- 指定した英単語をすべて必ず1回以上使用する
- 各文に最低2つの指定単語を含める
- 自然で実用的な英語（15〜25語程度）
- 各文に自然な日本語訳を付ける（元の日本語に近い訳）
- シチュエーションに合った会話・文章のトーンにする
- グループ数は正確に${groupingThemes.length}個

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

  return `あなたは英語学習支援の専門家です。以下の英単語を使い、テーマ別に例文を作成してください。

## 使用する英単語
${words.join(", ")}

## テーマ（${groupingThemes.length}グループ）
${groupingThemes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## シチュエーション（例文の場面・内容）
${situationText}

## 条件
- シチュエーションに合った場面設定で例文を書く
- 各文に最低2つの指定単語を使用
- グループ内の全単語を必ずすべて使用する
- 自然で実用的な英語（15〜25語程度）
- 自然な日本語訳も付ける
- グループ数は正確に${groupingThemes.length}個

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

export async function generateSentences(
  options: GenerateSentencesOptions
): Promise<GenerateResult> {
  const {
    words,
    wordEntries: existingWordEntries,
    studyMode = "toeic",
    sourceJapanese,
    themes,
    situations,
  } = options;

  if (words.length === 0) {
    throw new Error("単語が選択されていません");
  }

  const prompt = buildPrompt(options);
  const result = await generateJson<FullGenerateResponse>(prompt, 0.5);

  const groups = result.groups.filter(
    (g) => g.words.length > 0 && g.sentences.length > 0
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
    themes: themes?.length ? themes : undefined,
    situations: situations?.length ? situations : undefined,
  };
}
