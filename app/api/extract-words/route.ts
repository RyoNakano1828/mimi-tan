import { NextRequest, NextResponse } from "next/server";
import { extractWordsFromJapanese } from "@/lib/japaneseWordExtractor";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { japaneseText, themes } = await request.json();

    if (!japaneseText || typeof japaneseText !== "string" || !japaneseText.trim()) {
      return NextResponse.json(
        { error: "日本語の文章を入力してください" },
        { status: 400 }
      );
    }

    if (japaneseText.trim().length > 2000) {
      return NextResponse.json(
        { error: "2000文字以内で入力してください" },
        { status: 400 }
      );
    }

    const themeList =
      Array.isArray(themes) && themes.length > 0
        ? themes.filter((t): t is string => typeof t === "string")
        : undefined;

    const wordEntries = await extractWordsFromJapanese(
      japaneseText.trim(),
      themeList
    );

    if (wordEntries.length === 0) {
      return NextResponse.json(
        { error: "単語を抽出できませんでした" },
        { status: 500 }
      );
    }

    return NextResponse.json({ wordEntries });
  } catch (error) {
    console.error("Extract words error:", error);
    const message =
      error instanceof Error ? error.message : "単語抽出中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
