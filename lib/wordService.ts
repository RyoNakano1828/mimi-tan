import { supabase } from "./supabaseClient";

async function getOrCreateProfileId(): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;
  if (data?.id) return data.id;

  const userResp = await supabase.auth.getUser();
  const authUserId = userResp.data.user?.id;
  if (!authUserId) throw new Error("Not authenticated");

  const insertRes = await supabase
    .from("users")
    .insert({ auth_id: authUserId })
    .select("id")
    .single();

  if (insertRes.error) throw insertRes.error;
  return insertRes.data.id;
}

export async function createWord(opts: { word: string; theme?: string }) {
  const profileId = await getOrCreateProfileId();
  const saveBatchId = crypto.randomUUID();

  const { data: wordRow, error } = await supabase
    .from("words")
    .insert({
      user_id: profileId,
      word: opts.word,
      theme: opts.theme ?? null,
      save_batch_id: saveBatchId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { wordId: wordRow.id };
}

export async function createSentenceWithLink(opts: {
  wordId: string;
  english: string;
  japanese?: string;
  theme?: string;
}) {
  const profileId = await getOrCreateProfileId();
  const saveBatchId = crypto.randomUUID();

  const { data: sentenceRow, error: sentenceError } = await supabase
    .from("sentences")
    .insert({
      user_id: profileId,
      english: opts.english,
      japanese: opts.japanese ?? "",
      theme: opts.theme ?? "一般",
      save_batch_id: saveBatchId,
    })
    .select("id")
    .single();

  if (sentenceError) throw sentenceError;

  const { error: linkError } = await supabase.from("word_sentences").insert({
    word_id: opts.wordId,
    sentence_id: sentenceRow.id,
  });

  if (linkError) throw linkError;

  return { sentenceId: sentenceRow.id };
}
