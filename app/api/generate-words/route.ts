import { NextRequest, NextResponse } from "next/server";
import { generateWords } from "@/lib/aiWordGenerator";
import { DIFFICULTY_OPTIONS } from "@/lib/types";

export const maxDuration = 60;

const VALID_DIFFICULTIES = [
  ...DIFFICULTY_OPTIONS.map((d) => d.value),
  "beginner",
  "intermediate",
  "advanced",
];

export async function POST(request: NextRequest) {
  try {
    const { themes, situations, situationAuto, difficulty, count } =
      await request.json();

    if (!Array.isArray(themes) || themes.length === 0) {
      return NextResponse.json(
        { error: "テーマを1つ以上選択してください" },
        { status: 400 }
      );
    }

    const themeList = themes.filter(
      (t: unknown): t is string => typeof t === "string" && t.trim().length > 0
    );

    let situationList: string[] | null = null;
    if (!situationAuto && Array.isArray(situations) && situations.length > 0) {
      situationList = situations.filter(
        (s: unknown): s is string => typeof s === "string" && s.trim().length > 0
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

    const words = await generateWords(
      themeList,
      situationList,
      difficulty,
      wordCount
    );

    if (words.length === 0) {
      return NextResponse.json(
        { error: "単語を生成できませんでした" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      words,
      themes: themeList,
      situations: situationList,
      difficulty,
    });
  } catch (error) {
    console.error("Word generation error:", error);
    const message =
      error instanceof Error ? error.message : "単語生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
