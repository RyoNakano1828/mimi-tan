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
  txtContent: string;
  totalWords: number;
  totalSentences: number;
}

export interface WordGenerateResult {
  words: string[];
  situation: string;
  difficulty: string;
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

export const DIFFICULTY_OPTIONS = [
  { value: "400-500", label: "初級（400〜500点）" },
  { value: "600", label: "中級（600点前後）" },
  { value: "700-800", label: "上級（700〜800点）" },
] as const;

export interface SavedSessionSummary {
  id: string;
  title: string | null;
  words: string[];
  total_words: number;
  total_sentences: number;
  audio_path: string | null;
  created_at: string;
}

export interface SavedSessionDetail extends SavedSessionSummary {
  situation: string | null;
  difficulty: string | null;
  txt_content: string;
  groups: ThemeGroup[];
  audio_url: string | null;
}
