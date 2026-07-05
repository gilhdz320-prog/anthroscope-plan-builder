-- Patient progress tracking: longitudinal anthropometry per patient.
-- Each row is one measurement date. Charts on the patient detail page read
-- the last N days from this table.

CREATE TABLE IF NOT EXISTS patient_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg decimal(5,2),
  body_fat_pct decimal(4,1),
  lean_mass_kg decimal(5,2),
  waist_cm decimal(5,1),
  hip_cm decimal(5,1),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, recorded_at)
);

CREATE INDEX IF NOT EXISTS patient_progress_patient_date_idx
  ON patient_progress (patient_id, recorded_at DESC);

ALTER TABLE patient_progress ENABLE ROW LEVEL SECURITY;

-- Access is gated through ownership of the parent patient row.
DROP POLICY IF EXISTS "patient_progress_select_own" ON patient_progress;
CREATE POLICY "patient_progress_select_own"
  ON patient_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_insert_own" ON patient_progress;
CREATE POLICY "patient_progress_insert_own"
  ON patient_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_update_own" ON patient_progress;
CREATE POLICY "patient_progress_update_own"
  ON patient_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "patient_progress_delete_own" ON patient_progress;
CREATE POLICY "patient_progress_delete_own"
  ON patient_progress FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = patient_progress.patient_id AND p.user_id = auth.uid()
    )
  );
