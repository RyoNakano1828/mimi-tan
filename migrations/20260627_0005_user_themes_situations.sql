-- ユーザーごとのテーマ・シチュエーション + セッションメタデータ
-- Supabase SQL Editor で実行

CREATE TABLE IF NOT EXISTS public.user_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS public.user_situations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_situations_user_id ON public.user_situations(user_id);

ALTER TABLE public.sentences
  ADD COLUMN IF NOT EXISTS source_japanese text,
  ADD COLUMN IF NOT EXISTS themes jsonb,
  ADD COLUMN IF NOT EXISTS situations jsonb;

ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_situations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_themes_all_own" ON public.user_themes;
CREATE POLICY "user_themes_all_own" ON public.user_themes
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "user_situations_all_own" ON public.user_situations;
CREATE POLICY "user_situations_all_own" ON public.user_situations
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
