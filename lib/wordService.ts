import { supabase } from './supabaseClient';

type UploadResult = {
  path: string;
};

async function getOrCreateProfileId(): Promise<string> {
  // 1) 自分の public.users.id を取得
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .single();

  // If no row found, data will be null; handle accordingly
  if (error && (error as any).code !== 'PGRST116') {
    throw error;
  }
  if (data?.id) return data.id;

  // 2) なければ挿入（RLS が auth.uid() を参照するのでクライアント挿入が許可される設計）
  const userResp = await supabase.auth.getUser();
  const authUserId = userResp.data.user?.id;
  if (!authUserId) throw new Error('Not authenticated');

  const insertRes = await supabase
    .from('users')
    .insert({ auth_id: authUserId })
    .select('id')
    .single();

  if (insertRes.error) throw insertRes.error;
  return insertRes.data.id;
}

async function uploadAudioFile(userId: string, path: string, file: File): Promise<UploadResult> {
  // バケット名: 'audio'
  const storagePath = `${userId}/${path}`;
  const { error } = await supabase.storage
    .from('audio')
    .upload(storagePath, file, { upsert: false, contentType: file.type });

  if (error) throw error;

  return { path: storagePath };
}

export async function createWordWithOptionalAudio(opts: {
  word: string;
  language?: string;
  meaning?: any;
  phonetic?: string;
  audioFile?: File | null;
}) {
  const profileId = await getOrCreateProfileId();

  // 1) words レコードを作成
  const { data: wordRow, error: insertErr } = await supabase
    .from('words')
    .insert({
      user_id: profileId,
      word: opts.word,
      language: opts.language ?? 'en',
      meaning: opts.meaning ?? null,
      phonetic: opts.phonetic ?? null
    })
    .select('id')
    .single();

  if (insertErr) throw insertErr;
  const wordId = (wordRow as any).id as string;

  // 2) オーディオをアップロードしてパスを更新（任意）
  if (opts.audioFile) {
    const filename = opts.audioFile.name.replace(/\s+/g, '_');
    const remotePath = `words/${wordId}/${filename}`;
    await uploadAudioFile(profileId, remotePath, opts.audioFile);

    const { error: updErr } = await supabase
      .from('words')
      .update({ audio_path: `${profileId}/${remotePath}` })
      .eq('id', wordId);

    if (updErr) throw updErr;

    // uploads テーブルに記録（任意）
    await supabase.from('uploads').insert({
      user_id: profileId,
      storage_path: `${profileId}/${remotePath}`,
      file_name: filename,
      content_type: opts.audioFile.type,
      file_size: (opts.audioFile as any).size
    });
  }

  return { wordId };
}

export async function createExampleWithOptionalAudio(opts: {
  wordId: string;
  sentence: string;
  translation?: string;
  audioFile?: File | null;
}) {
  const profileId = await getOrCreateProfileId();

  // 1) examples レコード
  const { data: exampleRow, error: insertErr } = await supabase
    .from('examples')
    .insert({
      user_id: profileId,
      word_id: opts.wordId,
      sentence: opts.sentence,
      translation: opts.translation ?? null
    })
    .select('id')
    .single();

  if (insertErr) throw insertErr;
  const exampleId = (exampleRow as any).id as string;

  // 2) 音声をアップロードしてパスを更新（任意）
  if (opts.audioFile) {
    const filename = opts.audioFile.name.replace(/\s+/g, '_');
    const remotePath = `examples/${exampleId}/${filename}`;
    await uploadAudioFile(profileId, remotePath, opts.audioFile);

    const { error: updErr } = await supabase
      .from('examples')
      .update({ sentence_audio_path: `${profileId}/${remotePath}` })
      .eq('id', exampleId);

    if (updErr) throw updErr;

    // uploads テーブルに記録（任意）
    await supabase.from('uploads').insert({
      user_id: profileId,
      storage_path: `${profileId}/${remotePath}`,
      file_name: filename,
      content_type: opts.audioFile.type,
      file_size: (opts.audioFile as any).size
    });
  }

  return { exampleId };
}
