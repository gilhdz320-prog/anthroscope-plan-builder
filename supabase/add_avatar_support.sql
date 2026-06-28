-- Run in Supabase SQL Editor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
-- Also create a public storage bucket called 'avatars' in Supabase Dashboard > Storage
