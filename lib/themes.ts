export const THEME_LIST = [
  "採用・人事",
  "会議・カンファレンス",
  "契約・提案",
  "財務・予算",
  "マーケティング・広告",
  "物流・設備",
  "社内コミュニケーション",
  "ツアー・予約",
] as const;

export type ThemeName = (typeof THEME_LIST)[number];

export function getGroupCount(wordCount: number): number {
  if (wordCount <= 6) return 2;
  if (wordCount <= 12) return 3;
  if (wordCount <= 20) return 4;
  if (wordCount <= 30) return 6;
  if (wordCount <= 40) return 8;
  return 10;
}
