-- Dietary Recalls table for 24h, 3-day, and 7-day food recall forms
CREATE TABLE IF NOT EXISTS dietary_recalls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nutritionist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text,
  client_email text,
  token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex') UNIQUE,
  recall_type text NOT NULL DEFAULT '24h' CHECK (recall_type IN ('24h', '3day', '7day')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  responses jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Index for fast token lookups (public form access)
CREATE INDEX IF NOT EXISTS idx_dietary_recalls_token ON dietary_recalls(token);

-- Index for nutritionist queries
CREATE INDEX IF NOT EXISTS idx_dietary_recalls_nutritionist ON dietary_recalls(nutritionist_id);

-- RLS policies
ALTER TABLE dietary_recalls ENABLE ROW LEVEL SECURITY;

-- Nutritionists can see their own recalls
CREATE POLICY "Users can view own recalls"
  ON dietary_recalls FOR SELECT
  USING (auth.uid() = nutritionist_id);

-- Nutritionists can create recalls
CREATE POLICY "Users can insert own recalls"
  ON dietary_recalls FOR INSERT
  WITH CHECK (auth.uid() = nutritionist_id);

-- Nutritionists can delete their own recalls
CREATE POLICY "Users can delete own recalls"
  ON dietary_recalls FOR DELETE
  USING (auth.uid() = nutritionist_id);

-- Public update policy (for token-based form submission)
CREATE POLICY "Anyone can update via token"
  ON dietary_recalls FOR UPDATE
  USING (true)
  WITH CHECK (true);
