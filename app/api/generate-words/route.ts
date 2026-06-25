import { NextRequest, NextResponse } from "next/server";
import { generateWords } from "@/lib/aiWordGenerator";
import { DIFFICULTY_OPTIONS } from "@/lib/types";

export const maxDuration = 60;

const VALID_DIFFICULTIES = DIFFICULTY_OPTIONS.map((d) => d.value);

export async function POST(request: NextRequest) {
  try {
    const { situation, difficulty, count } = await request.json();

    if (!situation || typeof situation !== "string" || !situation.trim()) {
      return NextResponse.json(
        { error: "シチュエーションを指定してください" },
        { status: 400 }
      );
    }

    if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
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

    const words = await generateWords(situation.trim(), difficulty, wordCount);

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
    });
  } catch (error) {
    console.error("Word generation error:", error);
    const message =
      error instanceof Error ? error.message : "単語生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
