"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/authClient";
import type { User } from "@supabase/supabase-js";

interface AuthGuardProps {
  children: (user: User) => React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/");
        return;
      }
      setUser(data.user);
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="auth-loading">
        <span className="auth-spinner" />
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children(user)}</>;
}
