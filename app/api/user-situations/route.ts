import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabaseAuth";
import {
  addUserSituation,
  deleteUserSituation,
  listUserSituations,
} from "@/lib/userPreferencesRepository";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    const situations = await listUserSituations(user);
    return NextResponse.json({ situations });
  } catch (error) {
    console.error("List situations error:", error);
    const message =
      error instanceof Error ? error.message : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
    }
    const situation = await addUserSituation(user, name);
    return NextResponse.json({ situation });
  } catch (error) {
    console.error("Add situation error:", error);
    const message =
      error instanceof Error ? error.message : "追加に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }
    await deleteUserSituation(user, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete situation error:", error);
    const message =
      error instanceof Error ? error.message : "削除に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
