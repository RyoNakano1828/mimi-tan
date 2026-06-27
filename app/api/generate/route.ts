import { NextRequest, NextResponse } from "next/server";
import { generateSentences } from "@/lib/sentenceGenerator";
import type { AppStudyMode, WordEntry } from "@/lib/types";

export const maxDuration = 120;

const VALID_MODES: AppStudyMode[] = ["toeic", "daily"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      selectedWords,
      wordEntries: rawEntries,
      studyMode: rawMode,
      sourceJapanese,
      themes,
      situations,
    } = body;

    if (!Array.isArray(selectedWords) || selectedWords.length === 0) {
      return NextResponse.json(
        { error: "例文生成に使う単語を1つ以上選択してください" },
        { status: 400 }
      );
    }

    if (selectedWords.length > 50) {
      return NextResponse.json(
        { error: "単語は50個まで選択できます" },
        { status: 400 }
      );
    }

    const studyMode: AppStudyMode =
      rawMode && VALID_MODES.includes(rawMode) ? rawMode : "toeic";

    const words = selectedWords.filter(
      (w: unknown): w is string => typeof w === "string" && w.trim().length > 0
    );

    let wordEntries: WordEntry[] | undefined;
    if (Array.isArray(rawEntries) && rawEntries.length > 0) {
      wordEntries = rawEntries.filter(
        (e: unknown): e is WordEntry =>
          typeof e === "object" &&
          e !== null &&
          "word" in e &&
          typeof (e as WordEntry).word === "string"
      );
    }

    const themeList =
      Array.isArray(themes) && themes.length > 0
        ? themes.filter((t): t is string => typeof t === "string")
        : undefined;

    const situationList =
      Array.isArray(situations) && situations.length > 0
        ? situations.filter((s): s is string => typeof s === "string")
        : undefined;

    const result = await generateSentences({
      words,
      wordEntries,
      studyMode,
      sourceJapanese:
        typeof sourceJapanese === "string" ? sourceJapanese : undefined,
      themes: themeList,
      situations: situationList,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate error:", error);
    const message =
      error instanceof Error ? error.message : "生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
