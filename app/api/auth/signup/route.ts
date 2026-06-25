import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { formatAuthError } from "@/lib/authErrors";

async function ensureUserProfile(
  admin: ReturnType<typeof createAdminClient>,
  authUser: { id: string; email?: string | null }
) {
  const { error } = await admin.from("users").upsert(
    {
      auth_id: authUser.id,
      email: authUser.email ?? null,
      display_name: authUser.email ?? null,
    },
    { onConflict: "auth_id" }
  );
  if (error) {
    console.error("users upsert error:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "パスワードは6文字以上にしてください" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const trimmedEmail = email.trim();

    const { data, error } = await admin.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error("createUser error:", {
        message: error.message,
        status: error.status,
        code: (error as { code?: string }).code,
        name: error.name,
      });

      const msg = formatAuthError(error);
      const lower = msg.toLowerCase();

      if (
        lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists")
      ) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています。ログインしてください" },
          { status: 409 }
        );
      }

      if (lower.includes("database error")) {
        return NextResponse.json(
          {
            error:
              "データベースエラー: migrations/20260625_0003_fix_auth_trigger.sql を Supabase SQL Editor で実行してください",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (data.user) {
      await ensureUserProfile(admin, data.user);
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id ?? null,
    });
  } catch (error) {
    console.error("Signup API error:", error);
    const msg = formatAuthError(error);
    if (msg.includes("環境変数")) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
