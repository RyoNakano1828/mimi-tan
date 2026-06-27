import { NextRequest, NextResponse } from "next/server";
import { parseWords } from "@/lib/wordProcessor";
import { generateSentences } from "@/lib/sentenceGenerator";
import type { AppStudyMode, WordEntry } from "@/lib/types";

export const maxDuration = 120;

const VALID_MODES: AppStudyMode[] = ["toeic", "daily"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { words: rawInput, studyMode: rawMode, wordEntries: rawEntries } =
      body;

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json(
        { error: "単語リストを入力してください" },
        { status: 400 }
      );
    }

    const studyMode: AppStudyMode =
      rawMode && VALID_MODES.includes(rawMode) ? rawMode : "toeic";

    const words = parseWords(rawInput);

    if (words.length === 0) {
      return NextResponse.json(
        { error: "有効な単語が見つかりません" },
        { status: 400 }
      );
    }

    if (words.length > 50) {
      return NextResponse.json(
        { error: "単語は50個まで入力できます" },
        { status: 400 }
      );
    }

    let existingEntries: WordEntry[] | undefined;
    if (Array.isArray(rawEntries) && rawEntries.length > 0) {
      existingEntries = rawEntries.filter(
        (e: unknown): e is WordEntry =>
          typeof e === "object" &&
          e !== null &&
          "word" in e &&
          typeof (e as WordEntry).word === "string"
      );
    }

    const result = await generateSentences(words, studyMode, existingEntries);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate error:", error);
    const message =
      error instanceof Error ? error.message : "生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
