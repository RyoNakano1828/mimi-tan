"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/authClient";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

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
      <SignupForm />
      <Link href="/" className="auth-btn auth-btn--secondary">
        ログインに戻る
      </Link>
    </AuthShell>
  );
}
