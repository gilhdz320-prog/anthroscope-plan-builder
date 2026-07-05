-- Nutritionist branding profile: powers the premium PDF header, footer and
-- accent color. One row per user; upserted from the settings page.

CREATE TABLE IF NOT EXISTS nutritionist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  clinic_name text,
  professional_name text,
  license_number text,
  specialty text,
  phone text,
  address text,
  website text,
  accent_color text DEFAULT '#c9a961',
  logo_url text,
  signature_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nutritionist_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile" ON nutritionist_profiles;
CREATE POLICY "own profile" ON nutritionist_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
