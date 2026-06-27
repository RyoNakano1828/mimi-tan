"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/authClient";
import type { GenerateResult } from "@/lib/types";

interface SaveSessionButtonProps {
  result: GenerateResult;
  selectedWords: string[];
  themes?: string[];
  situations?: string[];
  difficulty?: string;
  sourceJapanese?: string;
  isLoggedIn: boolean;
}

export default function SaveSessionButton({
  result,
  selectedWords,
  themes,
  situations,
  difficulty,
  sourceJapanese,
  isLoggedIn,
}: SaveSessionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
          words: selectedWords,
          themes: themes ?? result.themes,
          situations: situations ?? result.situations,
          difficulty,
          sourceJapanese: sourceJapanese ?? result.sourceJapanese,
          studyMode: result.studyMode,
          wordEntries: result.wordEntries,
          includeAudio: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存に失敗しました");

      router.push(`/review?id=${data.sessionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={loading || !isLoggedIn}
      className="save-session-btn"
    >
      {loading ? "保存中（音声生成含む）..." : "データベースに保存"}
    </button>
  );
}
