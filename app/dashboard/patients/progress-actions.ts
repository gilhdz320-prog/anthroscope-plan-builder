'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Pliegues y perímetros ISAK (mm / cm). Opcionales en cada medición. */
export interface IsakMeasures {
  fold_triceps_mm: number | null
  fold_subscapular_mm: number | null
  fold_biceps_mm: number | null
  fold_iliac_mm: number | null
  fold_supraspinal_mm: number | null
  fold_abdominal_mm: number | null
  fold_thigh_mm: number | null
  fold_calf_mm: number | null
  girth_arm_cm: number | null
  girth_thigh_cm: number | null
  girth_calf_cm: number | null
  girth_chest_cm: number | null
}

export type ProgressEntry = {
  id: string
  patient_id: string
  recorded_at: string
  weight_kg: number | null
  body_fat_pct: number | null
  lean_mass_kg: number | null
  waist_cm: number | null
  hip_cm: number | null
  notes: string | null
} & Partial<IsakMeasures>

export type ProgressInput = {
  recorded_at?: string | null
  weight_kg?: number | null
  body_fat_pct?: number | null
  lean_mass_kg?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  notes?: string | null
} & Partial<Record<keyof IsakMeasures, number | null>>

const ISAK_KEYS: Array<keyof IsakMeasures> = [
  'fold_triceps_mm',
  'fold_subscapular_mm',
  'fold_biceps_mm',
  'fold_iliac_mm',
  'fold_supraspinal_mm',
  'fold_abdominal_mm',
  'fold_thigh_mm',
  'fold_calf_mm',
  'girth_arm_cm',
  'girth_thigh_cm',
  'girth_calf_cm',
  'girth_chest_cm',
]

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: unknown): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

/**
 * Solo envía las medidas ISAK que tienen valor. Así la acción funciona en una
 * base donde todavía no se aplicó add_isak_progress.sql.
 */
function isakPayload(data: ProgressInput): Partial<IsakMeasures> {
  const out: Partial<IsakMeasures> = {}
  for (const key of ISAK_KEYS) {
    const value = num(data[key])
    if (value !== null) out[key] = value
  }
  return out
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
    ...isakPayload(data),
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
    ...isakPayload(data),
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

  // select("*") para no romper la ficha si aún no se aplicó la migración ISAK.
  const { data } = await supabase
    .from('patient_progress')
    .select('*')
    .eq('patient_id', patientId)
    .gte('recorded_at', sinceStr)
    .order('recorded_at', { ascending: true })

  return (data ?? []) as ProgressEntry[]
}
