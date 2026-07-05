'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface ProgressEntry {
  id: string
  patient_id: string
  recorded_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  lean_mass_kg: number | null
  waist_cm: number | null
  hip_cm: number | null
  notes: string | null
}

export interface ProgressInput {
  recorded_at?: string | null
  weight_kg?: number | null
  body_fat_pct?: number | null
  lean_mass_kg?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  notes?: string | null
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: unknown): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

// Derive lean mass from weight + body-fat % when not supplied explicitly.
function withLeanMass(data: ProgressInput): ProgressInput {
  if (
    data.lean_mass_kg == null &&
    data.weight_kg != null &&
    data.body_fat_pct != null
  ) {
    const lean = data.weight_kg * (1 - data.body_fat_pct / 100)
    return { ...data, lean_mass_kg: Math.round(lean * 100) / 100 }
  }
  return data
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function addProgressEntry(patientId: string, data: ProgressInput) {
  const { supabase, user } = await requireUser()

  // Ownership check — RLS also enforces this, but fail early with a clear error.
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!patient) return { error: 'Paciente no encontrado.' }

  const clean = withLeanMass({
    recorded_at: str(data.recorded_at),
    weight_kg: num(data.weight_kg),
    body_fat_pct: num(data.body_fat_pct),
    lean_mass_kg: num(data.lean_mass_kg),
    waist_cm: num(data.waist_cm),
    hip_cm: num(data.hip_cm),
    notes: str(data.notes),
  })

  const payload = {
    patient_id: patientId,
    recorded_at: clean.recorded_at ?? new Date().toISOString().slice(0, 10),
    weight_kg: clean.weight_kg,
    body_fat_pct: clean.body_fat_pct,
    lean_mass_kg: clean.lean_mass_kg,
    waist_cm: clean.waist_cm,
    hip_cm: clean.hip_cm,
    notes: clean.notes,
  }

  // One measurement per date: overwrite an existing same-day entry.
  const { error } = await supabase
    .from('patient_progress')
    .upsert(payload, { onConflict: 'patient_id,recorded_at' })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null }
}

export async function updateProgressEntry(id: string, data: ProgressInput) {
  const { supabase } = await requireUser()

  const clean = withLeanMass({
    recorded_at: str(data.recorded_at),
    weight_kg: num(data.weight_kg),
    body_fat_pct: num(data.body_fat_pct),
    lean_mass_kg: num(data.lean_mass_kg),
    waist_cm: num(data.waist_cm),
    hip_cm: num(data.hip_cm),
    notes: str(data.notes),
  })

  const patch: Record<string, unknown> = {
    weight_kg: clean.weight_kg,
    body_fat_pct: clean.body_fat_pct,
    lean_mass_kg: clean.lean_mass_kg,
    waist_cm: clean.waist_cm,
    hip_cm: clean.hip_cm,
    notes: clean.notes,
  }
  if (clean.recorded_at) patch.recorded_at = clean.recorded_at

  const { data: updated, error } = await supabase
    .from('patient_progress')
    .update(patch)
    .eq('id', id)
    .select('patient_id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (updated?.patient_id) {
    revalidatePath(`/dashboard/patients/${updated.patient_id}`)
  }
  return { error: null }
}

export async function deleteProgressEntry(id: string) {
  const { supabase } = await requireUser()

  const { data: deleted, error } = await supabase
    .from('patient_progress')
    .delete()
    .eq('id', id)
    .select('patient_id')
    .maybeSingle()

  if (error) return { error: error.message }
  if (deleted?.patient_id) {
    revalidatePath(`/dashboard/patients/${deleted.patient_id}`)
  }
  return { error: null }
}

export async function getProgressHistory(
  patientId: string,
  days = 90,
): Promise<ProgressEntry[]> {
  const { supabase } = await requireUser()

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('patient_progress')
    .select(
      'id, patient_id, recorded_at, weight_kg, body_fat_pct, lean_mass_kg, waist_cm, hip_cm, notes',
    )
    .eq('patient_id', patientId)
    .gte('recorded_at', sinceStr)
    .order('recorded_at', { ascending: true })

  return (data ?? []) as ProgressEntry[]
}
