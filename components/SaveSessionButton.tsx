"use client";

import { useState } from "react";
import { getAccessToken } from "@/lib/authClient";
import type { GenerateResult } from "@/lib/types";
import { parseWords } from "@/lib/wordProcessor";

interface SaveSessionButtonProps {
  result: GenerateResult;
  wordsInput: string;
  situation?: string;
  difficulty?: string;
  isLoggedIn: boolean;
}

export default function SaveSessionButton({
  result,
  wordsInput,
  situation,
  difficulty,
  isLoggedIn,
}: SaveSessionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!isLoggedIn) {
      alert("保存するにはログインしてください");
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("ログインが必要です");

      const res = await fetch("/api/sessions/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          result,
          words: parseWords(wordsInput),
          situation,
          difficulty,
          includeAudio: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      setSaved(true);
      alert("保存しました！復習ページから確認できます。");
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={loading || saved || !isLoggedIn}
      style={{
        padding: "14px 32px",
        fontSize: "15px",
        fontWeight: 600,
        background: saved ? "var(--border)" : "#8b5cf6",
        color: "#fff",
        borderRadius: "var(--radius)",
        opacity: !isLoggedIn ? 0.5 : 1,
      }}
    >
      {loading ? "保存中（音声生成含む）..." : saved ? "保存済み" : "Save to Supabase"}
    </button>
  );
}
