import "server-only";

import { createAdminClient } from "./supabaseAdmin";
import { generateAudioFromTxt } from "./tts";
import type {
  AppStudyMode,
  GenerateResult,
  SavedSessionDetail,
  SavedSessionSummary,
  ThemeGroup,
  WordEntry,
} from "./types";
import { STUDY_MODE_LABELS } from "./types";
import type { User } from "@supabase/supabase-js";

export interface SaveSessionInput {
  user: User;
  result: GenerateResult;
  words: string[];
  title?: string;
  situation?: string;
  difficulty?: string;
  studyMode?: AppStudyMode;
  wordEntries?: WordEntry[];
  sourceJapanese?: string;
  themes?: string[];
  situations?: string[];
  includeAudio?: boolean;
}

async function getOrCreateProfileId(
  admin: ReturnType<typeof createAdminClient>,
  user: User
): Promise<string> {
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("users")
    .insert({
      auth_id: user.id,
      email: user.email ?? null,
      display_name: user.email ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function buildTranslationMap(entries: WordEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of entries) {
    map.set(normalizeWord(e.word), e.japanese);
  }
  return map;
}

function buildSessionTitle(
  studyMode: AppStudyMode,
  themes: string[] | null | undefined,
  situation: string | null | undefined,
  wordCount: number,
  createdAt?: string
): string {
  if (themes && themes.length > 0) {
    const label = themes.slice(0, 2).join("・");
    return `${label} (${wordCount}語)`;
  }
  if (situation) {
    return `${STUDY_MODE_LABELS[studyMode]} · ${situation} (${wordCount}語)`;
  }
  const date = createdAt
    ? new Date(createdAt).toLocaleDateString("ja-JP")
    : new Date().toLocaleDateString("ja-JP");
  return `${STUDY_MODE_LABELS[studyMode]} · ${date} (${wordCount}語)`;
}

export async function saveStudySession(
  input: SaveSessionInput
): Promise<{ sessionId: string }> {
  const admin = createAdminClient();
  const profileId = await getOrCreateProfileId(admin, input.user);
  const saveBatchId = crypto.randomUUID();
  const studyMode = input.studyMode ?? input.result.studyMode ?? "toeic";
  const sessionThemes = input.themes ?? input.result.themes ?? null;
  const sessionSituations =
    input.situations ?? input.result.situations ?? null;
  const sourceJapanese =
    input.sourceJapanese ?? input.result.sourceJapanese ?? null;

  const wordEntries =
    input.wordEntries && input.wordEntries.length > 0
      ? input.wordEntries
      : input.result.wordEntries ?? [];

  const translationMap = buildTranslationMap(wordEntries);

  let audioPath: string | null = null;

  if (input.includeAudio !== false) {
    const audioBuffer = await generateAudioFromTxt(input.result.txtContent);
    audioPath = `${input.user.id}/batches/${saveBatchId}/sentences.wav`;

    const { error: uploadError } = await admin.storage
      .from("audio")
      .upload(audioPath, audioBuffer, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadError) throw uploadError;
  }

  const wordIdMap = new Map<string, string>();
  const themeByWord = new Map<string, string>();

  for (const group of input.result.groups) {
    for (const w of group.words) {
      themeByWord.set(normalizeWord(w), group.theme);
    }
  }

  for (const word of input.words) {
    const key = normalizeWord(word);
    if (wordIdMap.has(key)) continue;

    const { data: wordRow, error: wordError } = await admin
      .from("words")
      .insert({
        user_id: profileId,
        word: word.trim(),
        japanese: translationMap.get(key) ?? null,
        theme: themeByWord.get(key) ?? null,
        situation: input.situation ?? null,
        difficulty: input.difficulty ?? null,
        study_mode: studyMode,
        save_batch_id: saveBatchId,
      })
      .select("id")
      .single();

    if (wordError) throw wordError;
    wordIdMap.set(key, wordRow.id);
  }

  let sortOrder = 0;

  for (const group of input.result.groups) {
    for (const sentence of group.sentences) {
      const { data: sentenceRow, error: sentenceError } = await admin
        .from("sentences")
        .insert({
          user_id: profileId,
          english: sentence.english,
          japanese: sentence.japanese,
          theme: group.theme,
          txt_content: input.result.txtContent,
          audio_path: audioPath,
          situation: input.situation ?? null,
          difficulty: input.difficulty ?? null,
          study_mode: studyMode,
          source_japanese: sourceJapanese,
          themes: sessionThemes,
          situations: sessionSituations,
          save_batch_id: saveBatchId,
          sort_order: sortOrder++,
        })
        .select("id")
        .single();

      if (sentenceError) throw sentenceError;

      const linkedWords = new Set<string>();

      for (const used of sentence.wordsUsed) {
        const key = normalizeWord(used);
        let wordId = wordIdMap.get(key);

        if (!wordId) {
          const { data: newWord, error: newWordError } = await admin
            .from("words")
            .insert({
              user_id: profileId,
              word: used.trim(),
              japanese: translationMap.get(key) ?? null,
              theme: group.theme,
              situation: input.situation ?? null,
              difficulty: input.difficulty ?? null,
              study_mode: studyMode,
              save_batch_id: saveBatchId,
            })
            .select("id")
            .single();

          if (newWordError) throw newWordError;
          wordId = newWord.id as string;
          wordIdMap.set(key, wordId);
        }

        if (linkedWords.has(wordId)) continue;
        linkedWords.add(wordId);

        const { error: linkError } = await admin.from("word_sentences").insert({
          word_id: wordId,
          sentence_id: sentenceRow.id,
        });

        if (linkError) throw linkError;
      }
    }
  }

  return { sessionId: saveBatchId };
}

async function fetchWordEntriesForBatch(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  saveBatchId: string
): Promise<WordEntry[]> {
  const { data: words } = await admin
    .from("words")
    .select("word, japanese")
    .eq("user_id", profileId)
    .eq("save_batch_id", saveBatchId)
    .order("created_at");

  return (words ?? []).map((w) => ({
    word: w.word,
    japanese: w.japanese ?? "",
  }));
}

export async function listStudySessions(
  user: User
): Promise<SavedSessionSummary[]> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!profile?.id) return [];

  const { data: batches, error } = await admin
    .from("sentences")
    .select(
      "save_batch_id, situation, difficulty, audio_path, study_mode, themes, created_at"
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const batchMap = new Map<string, SavedSessionSummary>();

  for (const row of batches ?? []) {
    if (batchMap.has(row.save_batch_id)) continue;

    const { count: wordCount } = await admin
      .from("words")
      .select("*", { count: "exact", head: true })
      .eq("save_batch_id", row.save_batch_id);

    const { count: sentenceCount } = await admin
      .from("sentences")
      .select("*", { count: "exact", head: true })
      .eq("save_batch_id", row.save_batch_id);

    const wordEntries = await fetchWordEntriesForBatch(
      admin,
      profile.id,
      row.save_batch_id
    );

    const studyMode = (row.study_mode as AppStudyMode) ?? "toeic";
    const themes = (row.themes as string[] | null) ?? null;

    batchMap.set(row.save_batch_id, {
      id: row.save_batch_id,
      title: buildSessionTitle(
        studyMode,
        themes,
        row.situation,
        wordCount ?? 0,
        row.created_at
      ),
      words: wordEntries.map((w) => w.word),
      word_entries: wordEntries,
      total_words: wordCount ?? 0,
      total_sentences: sentenceCount ?? 0,
      audio_path: row.audio_path,
      study_mode: studyMode,
      created_at: row.created_at,
    });
  }

  return Array.from(batchMap.values());
}

export async function getStudySessionDetail(
  user: User,
  saveBatchId: string
): Promise<SavedSessionDetail | null> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!profile?.id) return null;

  const { data: sentences, error: sentencesError } = await admin
    .from("sentences")
    .select("*")
    .eq("user_id", profile.id)
    .eq("save_batch_id", saveBatchId)
    .order("sort_order");

  if (sentencesError) throw sentencesError;
  if (!sentences || sentences.length === 0) return null;

  const { data: words, error: wordsError } = await admin
    .from("words")
    .select("word, japanese, theme")
    .eq("user_id", profile.id)
    .eq("save_batch_id", saveBatchId);

  if (wordsError) throw wordsError;

  const wordEntries: WordEntry[] = (words ?? []).map((w) => ({
    word: w.word,
    japanese: w.japanese ?? "",
  }));

  const first = sentences[0];
  const studyMode = (first.study_mode as AppStudyMode) ?? "toeic";
  const sessionThemes = (first.themes as string[] | null) ?? null;
  const sessionSituations = (first.situations as string[] | null) ?? null;
  const sourceJapanese = (first.source_japanese as string | null) ?? null;
  const themeMap = new Map<string, ThemeGroup>();

  for (const s of sentences) {
    if (!themeMap.has(s.theme)) {
      const themeWords = (words ?? [])
        .filter((w) => w.theme === s.theme)
        .map((w) => w.word);
      themeMap.set(s.theme, { theme: s.theme, words: themeWords, sentences: [] });
    }

    const { data: links } = await admin
      .from("word_sentences")
      .select("word_id")
      .eq("sentence_id", s.id);

    const wordsUsed: string[] = [];
    for (const link of links ?? []) {
      const { data: wordRow } = await admin
        .from("words")
        .select("word")
        .eq("id", link.word_id)
        .maybeSingle();
      if (wordRow?.word) wordsUsed.push(wordRow.word);
    }

    themeMap.get(s.theme)!.sentences.push({
      english: s.english,
      japanese: s.japanese,
      wordsUsed,
    });
  }

  let audioUrl: string | null = null;
  if (first.audio_path) {
    const { data: signed } = await admin.storage
      .from("audio")
      .createSignedUrl(first.audio_path, 3600);
    audioUrl = signed?.signedUrl ?? null;
  }

  const { count: wordCount } = await admin
    .from("words")
    .select("*", { count: "exact", head: true })
    .eq("save_batch_id", saveBatchId);

  return {
    id: saveBatchId,
    title: buildSessionTitle(
      studyMode,
      sessionThemes,
      first.situation,
      wordCount ?? 0,
      first.created_at
    ),
    words: wordEntries.map((w) => w.word),
    word_entries: wordEntries,
    situation: first.situation,
    difficulty: first.difficulty,
    study_mode: studyMode,
    source_japanese: sourceJapanese,
    themes: sessionThemes,
    situations: sessionSituations,
    txt_content: first.txt_content ?? "",
    total_words: wordCount ?? 0,
    total_sentences: sentences.length,
    audio_path: first.audio_path,
    created_at: first.created_at,
    groups: Array.from(themeMap.values()),
    audio_url: audioUrl,
  };
}
