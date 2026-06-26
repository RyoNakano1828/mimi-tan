"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/authClient";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const registered = searchParams.get("registered") === "1";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/app");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="auth-loading">
        <span className="auth-spinner" />
      </div>
    );
  }

  return (
    <AuthShell>
      {registered && (
        <p className="auth-alert auth-alert--success">
          登録が完了しました。ログインしてください。
        </p>
      )}
      <LoginForm />
      <Link href="/signup" className="auth-btn auth-btn--secondary">
        新規登録
      </Link>
    </AuthShell>
  );
}
