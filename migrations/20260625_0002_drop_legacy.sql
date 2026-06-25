-- 旧スキーマ（study_sessions 系）から移行する場合に実行
-- 新規インストールで 0001 を実行済みの場合は不要

DROP TABLE IF EXISTS public.study_sentences CASCADE;
DROP TABLE IF EXISTS public.study_theme_groups CASCADE;
DROP TABLE IF EXISTS public.study_sessions CASCADE;
DROP TABLE IF EXISTS public.examples CASCADE;
DROP TABLE IF EXISTS public.uploads CASCADE;
