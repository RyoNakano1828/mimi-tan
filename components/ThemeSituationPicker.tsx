"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/authClient";
import type { UserPreferenceItem } from "@/lib/types";

interface ThemeSituationPickerProps {
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
  selectedSituations: string[];
  onSituationsChange: (situations: string[]) => void;
  situationAuto: boolean;
  onSituationAutoChange: (auto: boolean) => void;
  disabled?: boolean;
}

async function authFetch(url: string, options?: RequestInit) {
  const token = await getAccessToken();
  if (!token) throw new Error("ログインが必要です");
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

export default function ThemeSituationPicker({
  selectedThemes,
  onThemesChange,
  selectedSituations,
  onSituationsChange,
  situationAuto,
  onSituationAutoChange,
  disabled,
}: ThemeSituationPickerProps) {
  const [themes, setThemes] = useState<UserPreferenceItem[]>([]);
  const [situations, setSituations] = useState<UserPreferenceItem[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [newSituation, setNewSituation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tRes, sRes] = await Promise.all([
        authFetch("/api/user-themes"),
        authFetch("/api/user-situations"),
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      if (!tRes.ok) throw new Error(tData.error || "テーマ取得失敗");
      if (!sRes.ok) throw new Error(sData.error || "シチュエーション取得失敗");
      setThemes(tData.themes ?? []);
      setSituations(sData.situations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTheme = (name: string) => {
    if (disabled) return;
    if (selectedThemes.includes(name)) {
      onThemesChange(selectedThemes.filter((t) => t !== name));
    } else {
      onThemesChange([...selectedThemes, name]);
    }
  };

  const toggleSituation = (name: string) => {
    if (disabled || situationAuto) return;
    if (selectedSituations.includes(name)) {
      onSituationsChange(selectedSituations.filter((s) => s !== name));
    } else {
      onSituationsChange([...selectedSituations, name]);
    }
  };

  const handleAddTheme = async () => {
    const name = newTheme.trim();
    if (!name) return;
    try {
      const res = await authFetch("/api/user-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThemes((prev) => [...prev, data.theme]);
      onThemesChange([...selectedThemes, data.theme.name]);
      setNewTheme("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleDeleteTheme = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    try {
      const res = await authFetch(`/api/user-themes?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThemes((prev) => prev.filter((t) => t.id !== id));
      onThemesChange(selectedThemes.filter((t) => t !== name));
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const handleAddSituation = async () => {
    const name = newSituation.trim();
    if (!name) return;
    try {
      const res = await authFetch("/api/user-situations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSituations((prev) => [...prev, data.situation]);
      if (!situationAuto) {
        onSituationsChange([...selectedSituations, data.situation.name]);
      }
      setNewSituation("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleDeleteSituation = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    try {
      const res = await authFetch(`/api/user-situations?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSituations((prev) => prev.filter((s) => s.id !== id));
      onSituationsChange(selectedSituations.filter((s) => s !== name));
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  if (loading) {
    return <p className="pref-picker__loading">テーマ・シチュエーション読込中...</p>;
  }

  return (
    <div className="pref-picker">
      {error && <p className="pref-picker__error">{error}</p>}

      <section className="pref-picker__section">
        <h3 className="pref-picker__heading">テーマ（何について学ぶか）</h3>
        <p className="pref-picker__desc">複数選択可 — 生成する英単語の種類を決めます</p>
        <div className="pref-picker__chips">
          {themes.map((t) => (
            <span key={t.id} className="pref-picker__chip-wrap">
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleTheme(t.name)}
                className={`pref-picker__chip${
                  selectedThemes.includes(t.name)
                    ? " pref-picker__chip--active"
                    : ""
                }`}
              >
                {t.name}
              </button>
              <button
                type="button"
                className="pref-picker__delete"
                onClick={() => handleDeleteTheme(t.id, t.name)}
                title="削除"
                aria-label={`${t.name}を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="pref-picker__add">
          <input
            type="text"
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            placeholder="新しいテーマを追加"
            disabled={disabled}
            className="pref-picker__input"
            onKeyDown={(e) => e.key === "Enter" && handleAddTheme()}
          />
          <button
            type="button"
            onClick={handleAddTheme}
            disabled={disabled || !newTheme.trim()}
            className="pref-picker__add-btn"
          >
            追加
          </button>
        </div>
      </section>

      <section className="pref-picker__section">
        <h3 className="pref-picker__heading">シチュエーション（どの場面で使うか）</h3>
        <p className="pref-picker__desc">
          複数選択可 — 例文の場面・会話内容を決めます
        </p>
        <label className="pref-picker__auto">
          <input
            type="checkbox"
            checked={situationAuto}
            onChange={(e) => {
              onSituationAutoChange(e.target.checked);
              if (e.target.checked) onSituationsChange([]);
            }}
            disabled={disabled}
          />
          おまかせ（AIがテーマに合った場面を自動選択）
        </label>
        <div
          className={`pref-picker__chips${situationAuto ? " pref-picker__chips--disabled" : ""}`}
        >
          {situations.map((s) => (
            <span key={s.id} className="pref-picker__chip-wrap">
              <button
                type="button"
                disabled={disabled || situationAuto}
                onClick={() => toggleSituation(s.name)}
                className={`pref-picker__chip${
                  selectedSituations.includes(s.name)
                    ? " pref-picker__chip--active"
                    : ""
                }`}
              >
                {s.name}
              </button>
              <button
                type="button"
                className="pref-picker__delete"
                onClick={() => handleDeleteSituation(s.id, s.name)}
                title="削除"
                aria-label={`${s.name}を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="pref-picker__add">
          <input
            type="text"
            value={newSituation}
            onChange={(e) => setNewSituation(e.target.value)}
            placeholder="新しいシチュエーションを追加"
            disabled={disabled}
            className="pref-picker__input"
            onKeyDown={(e) => e.key === "Enter" && handleAddSituation()}
          />
          <button
            type="button"
            onClick={handleAddSituation}
            disabled={disabled || !newSituation.trim()}
            className="pref-picker__add-btn"
          >
            追加
          </button>
        </div>
      </section>
    </div>
  );
}
