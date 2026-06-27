export type AppStudyMode = "toeic" | "daily";

export interface WordEntry {
  word: string;
  japanese: string;
}

export interface Sentence {
  english: string;
  japanese: string;
  wordsUsed: string[];
}

export interface ThemeGroup {
  theme: string;
  words: string[];
  sentences: Sentence[];
}

export interface GenerateResult {
  groups: ThemeGroup[];
  wordEntries: WordEntry[];
  txtContent: string;
  totalWords: number;
  totalSentences: number;
  studyMode: AppStudyMode;
}

export interface WordGenerateResult {
  words: WordEntry[];
  situation: string;
  difficulty: string;
  studyMode: AppStudyMode;
}

export const SITUATION_OPTIONS = [
  "採用・人事",
  "会議・カンファレンス",
  "契約・提案",
  "財務・予算",
  "マーケティング・広告",
  "物流・設備",
  "社内コミュニケーション",
  "ツアー・予約",
] as const;

export const DAILY_SITUATION_OPTIONS = [
  "買い物・スーパー",
  "レストラン・カフェ",
  "旅行・観光",
  "友人との会話",
  "家族・家庭",
  "健康・病院",
  "趣味・スポーツ",
  "天気・日常の出来事",
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "400-500", label: "初級（400〜500点）" },
  { value: "600", label: "中級（600点前後）" },
  { value: "700-800", label: "上級（700〜800点）" },
] as const;

export const DAILY_DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "初級（基本表現）" },
  { value: "intermediate", label: "中級（日常会話）" },
  { value: "advanced", label: "上級（自然な表現）" },
] as const;

export const STUDY_MODE_LABELS: Record<AppStudyMode, string> = {
  toeic: "TOEIC・仕事",
  daily: "日常会話",
};

export interface SavedSessionSummary {
  id: string;
  title: string | null;
  words: string[];
  word_entries: WordEntry[];
  total_words: number;
  total_sentences: number;
  audio_path: string | null;
  study_mode: AppStudyMode;
  created_at: string;
}

export interface SavedSessionDetail extends SavedSessionSummary {
  situation: string | null;
  difficulty: string | null;
  txt_content: string;
  groups: ThemeGroup[];
  audio_url: string | null;
}
