-- migrations/20260613_0005_auth_sync.sql
-- Create public.users row when an auth.users row is created.
-- Run after RLS/tables are created.

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a profile row mapping auth users.id -> public.users.auth_id
  INSERT INTO public.users (id, auth_id, email, display_name, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta->>'display_name', NEW.email),
    now(),
    now()
  )
  ON CONFLICT (auth_id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
        updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on auth.users (Supabase auth schema)
DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();
