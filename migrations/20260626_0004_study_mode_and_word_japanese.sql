-- study_mode（toeic / daily）と単語の日本語訳カラムを追加
-- Supabase SQL Editor で実行

ALTER TABLE public.words
  ADD COLUMN IF NOT EXISTS japanese text,
  ADD COLUMN IF NOT EXISTS study_mode text NOT NULL DEFAULT 'toeic';

ALTER TABLE public.sentences
  ADD COLUMN IF NOT EXISTS study_mode text NOT NULL DEFAULT 'toeic';

CREATE INDEX IF NOT EXISTS idx_words_study_mode ON public.words(study_mode);
CREATE INDEX IF NOT EXISTS idx_sentences_study_mode ON public.sentences(study_mode);
