import { NextRequest, NextResponse } from "next/server";
import { generateWords } from "@/lib/aiWordGenerator";
import {
  DIFFICULTY_OPTIONS,
  DAILY_DIFFICULTY_OPTIONS,
  type AppStudyMode,
} from "@/lib/types";

export const maxDuration = 60;

const VALID_TOEIC_DIFFICULTIES = DIFFICULTY_OPTIONS.map((d) => d.value);
const VALID_DAILY_DIFFICULTIES = DAILY_DIFFICULTY_OPTIONS.map((d) => d.value);
const VALID_MODES: AppStudyMode[] = ["toeic", "daily"];

export async function POST(request: NextRequest) {
  try {
    const { situation, difficulty, count, studyMode: rawMode } =
      await request.json();

    const studyMode: AppStudyMode =
      rawMode && VALID_MODES.includes(rawMode) ? rawMode : "toeic";

    if (!situation || typeof situation !== "string" || !situation.trim()) {
      return NextResponse.json(
        { error: "シチュエーションを指定してください" },
        { status: 400 }
      );
    }

    const validDifficulties: string[] =
      studyMode === "daily"
        ? [...VALID_DAILY_DIFFICULTIES]
        : [...VALID_TOEIC_DIFFICULTIES];

    if (!difficulty || !validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: "難易度を指定してください" },
        { status: 400 }
      );
    }

    const wordCount = Number(count);
    if (!Number.isInteger(wordCount) || wordCount < 5 || wordCount > 30) {
      return NextResponse.json(
        { error: "単語数は5〜30個で指定してください" },
        { status: 400 }
      );
    }

    const words = await generateWords(
      situation.trim(),
      difficulty,
      wordCount,
      studyMode
    );

    if (words.length === 0) {
      return NextResponse.json(
        { error: "単語を生成できませんでした" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      words,
      situation: situation.trim(),
      difficulty,
      studyMode,
    });
  } catch (error) {
    console.error("Word generation error:", error);
    const message =
      error instanceof Error ? error.message : "単語生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
