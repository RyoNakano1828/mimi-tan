import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabaseAuth";
import { saveStudySession } from "@/lib/studySessionRepository";
import type { AppStudyMode, GenerateResult, WordEntry } from "@/lib/types";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const body = await request.json();
    const {
      result,
      words,
      title,
      situation,
      difficulty,
      studyMode,
      wordEntries,
      sourceJapanese,
      themes,
      situations,
      includeAudio,
    } = body;

    if (!result || !words || !Array.isArray(words)) {
      return NextResponse.json(
        { error: "保存データが不正です" },
        { status: 400 }
      );
    }

    const { sessionId } = await saveStudySession({
      user,
      result: result as GenerateResult,
      words,
      title,
      situation,
      difficulty,
      studyMode: studyMode as AppStudyMode | undefined,
      wordEntries: wordEntries as WordEntry[] | undefined,
      sourceJapanese,
      themes,
      situations,
      includeAudio: includeAudio !== false,
    });

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Save session error:", error);
    const message =
      error instanceof Error ? error.message : "保存中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
