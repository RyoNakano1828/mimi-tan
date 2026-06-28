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
  return getSentencePlan(wordCount).groups;
}

/** 単語数に応じた例文数・グループ数（学習負担を抑える） */
export function getSentencePlan(wordCount: number): {
  groups: number;
  maxSentences: number;
} {
  if (wordCount <= 3) return { groups: 1, maxSentences: 1 };
  if (wordCount <= 5) return { groups: 1, maxSentences: 2 };
  if (wordCount <= 8) return { groups: 1, maxSentences: 2 };
  if (wordCount <= 12) return { groups: 2, maxSentences: 3 };
  if (wordCount <= 18) return { groups: 2, maxSentences: 4 };
  return { groups: 2, maxSentences: 5 };
}
