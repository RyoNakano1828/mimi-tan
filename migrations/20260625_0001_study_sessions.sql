-- TOEIC Sentence Builder: 4テーブル構成
-- ユーザー / 単語 / 例文 / 単語例文
-- Supabase Dashboard > SQL Editor で実行

-- ============================================================
-- 1. ユーザー (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- ============================================================
-- 2. 単語 (words)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  theme text,
  situation text,
  difficulty text,
  save_batch_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_words_user_id ON public.words(user_id);
CREATE INDEX IF NOT EXISTS idx_words_save_batch_id ON public.words(save_batch_id);
CREATE INDEX IF NOT EXISTS idx_words_word ON public.words(user_id, word);

-- ============================================================
-- 3. 例文 (sentences)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  english text NOT NULL,
  japanese text NOT NULL,
  theme text NOT NULL,
  txt_content text,
  audio_path text,
  situation text,
  difficulty text,
  save_batch_id uuid NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentences_user_id ON public.sentences(user_id);
CREATE INDEX IF NOT EXISTS idx_sentences_save_batch_id ON public.sentences(save_batch_id);

-- ============================================================
-- 4. 単語例文 (word_sentences) — 多対多
-- ============================================================
CREATE TABLE IF NOT EXISTS public.word_sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id uuid NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  sentence_id uuid NOT NULL REFERENCES public.sentences(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (word_id, sentence_id)
);

CREATE INDEX IF NOT EXISTS idx_word_sentences_word_id ON public.word_sentences(word_id);
CREATE INDEX IF NOT EXISTS idx_word_sentences_sentence_id ON public.word_sentences(sentence_id);

-- ============================================================
-- updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_sentences ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated USING (auth_id = auth.uid());

-- words
DROP POLICY IF EXISTS "words_all_own" ON public.words;
CREATE POLICY "words_all_own" ON public.words
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- sentences
DROP POLICY IF EXISTS "sentences_all_own" ON public.sentences;
CREATE POLICY "sentences_all_own" ON public.sentences
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- word_sentences（親テーブル経由）
DROP POLICY IF EXISTS "word_sentences_all_own" ON public.word_sentences;
CREATE POLICY "word_sentences_all_own" ON public.word_sentences
  FOR ALL TO authenticated
  USING (
    word_id IN (
      SELECT w.id FROM public.words w
      JOIN public.users u ON u.id = w.user_id
      WHERE u.auth_id = auth.uid()
    )
  )
  WITH CHECK (
    word_id IN (
      SELECT w.id FROM public.words w
      JOIN public.users u ON u.id = w.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================================
-- Storage バケット（音声）
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio', 'audio', false, 52428800,
  ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "audio_select_own" ON storage.objects;
CREATE POLICY "audio_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "audio_insert_own" ON storage.objects;
CREATE POLICY "audio_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "audio_delete_own" ON storage.objects;
CREATE POLICY "audio_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio' AND (storage.foldername(name))[1] = auth.uid()::text);
