import { NextRequest, NextResponse } from "next/server";
import { parseWords } from "@/lib/wordProcessor";
import { generateSentences } from "@/lib/sentenceGenerator";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { words: rawInput } = await request.json();

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json(
        { error: "単語リストを入力してください" },
        { status: 400 }
      );
    }

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

    const result = await generateSentences(words);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate error:", error);
    const message =
      error instanceof Error ? error.message : "生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
