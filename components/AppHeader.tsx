"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/authClient";
import type { User } from "@supabase/supabase-js";

interface AppHeaderProps {
  user: User;
  active?: "main" | "review";
}

export default function AppHeader({ user, active = "main" }: AppHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href="/app" className="app-header__logo">
          みみたん
        </Link>

        <nav className="app-header__nav">
          <Link
            href="/app"
            className={`app-header__link${active === "main" ? " app-header__link--active" : ""}`}
          >
            例文作成
          </Link>
          <Link
            href="/review"
            className={`app-header__link${active === "review" ? " app-header__link--active" : ""}`}
          >
            復習
          </Link>
        </nav>

        <div className="app-header__user">
          <span className="app-header__email">{user.email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="app-header__logout"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
