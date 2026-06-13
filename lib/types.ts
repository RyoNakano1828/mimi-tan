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
