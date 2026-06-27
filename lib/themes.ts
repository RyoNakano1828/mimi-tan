import type { AppStudyMode } from "./types";

export const TOEIC_THEME_LIST = [
  "採用・人事",
  "会議・カンファレンス",
  "契約・提案",
  "財務・予算",
  "マーケティング・広告",
  "物流・設備",
  "社内コミュニケーション",
  "ツアー・予約",
] as const;

export const DAILY_THEME_LIST = [
  "買い物・お店",
  "レストラン・食事",
  "旅行・交通",
  "友人・家族",
  "健康・病院",
  "趣味・余暇",
  "天気・季節",
  "近所・コミュニティ",
] as const;

/** @deprecated use TOEIC_THEME_LIST */
export const THEME_LIST = TOEIC_THEME_LIST;

export type ThemeName = (typeof TOEIC_THEME_LIST)[number];

export function getThemeList(studyMode: AppStudyMode): readonly string[] {
  return studyMode === "daily" ? DAILY_THEME_LIST : TOEIC_THEME_LIST;
}

export function getGroupCount(wordCount: number): number {
  if (wordCount <= 6) return 2;
  if (wordCount <= 12) return 3;
  if (wordCount <= 20) return 4;
  if (wordCount <= 30) return 6;
  if (wordCount <= 40) return 8;
  return 10;
}
