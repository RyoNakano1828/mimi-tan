import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabaseAuth";
import {
  getStudySessionDetail,
  listStudySessions,
} from "@/lib/studySessionRepository";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("id");
    if (sessionId) {
      const detail = await getStudySessionDetail(user, sessionId);
      if (!detail) {
        return NextResponse.json(
          { error: "セッションが見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json(detail);
    }

    const sessions = await listStudySessions(user);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("List sessions error:", error);
    const message =
      error instanceof Error ? error.message : "取得中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
