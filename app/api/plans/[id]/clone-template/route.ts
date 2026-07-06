import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: planId } = await params

  // Authenticate the user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify plan belongs to user and get template_id
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .select('id, template_id, user_id')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (planErr || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  if (!plan.template_id) {
    return NextResponse.json({ cloned: 0, message: 'No template_id on plan' })
  }

  // Use admin client to read template_meals (bypasses RLS)
  const admin = createAdminClient()
  const { data: tplMeals, error: tplErr } = await admin
    .from('template_meals')
    .select('meal_name, meal_order, equivalent_id, servings, notes')
    .eq('template_id', plan.template_id)
    .order('meal_order', { ascending: true })

  if (tplErr) {
    return NextResponse.json({ error: tplErr.message }, { status: 500 })
  }

  if (!tplMeals || tplMeals.length === 0) {
    return NextResponse.json({ cloned: 0, message: 'No template meals found' })
  }

  // Check if plan already has meals (avoid double-cloning)
  const { count } = await admin
    .from('plan_meals')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId)

  if (count && count > 0) {
    return NextResponse.json({ cloned: 0, message: 'Plan already has meals' })
  }

  // Insert all template meals into plan_meals
  const rows = tplMeals.map((m) => ({
    plan_id: planId,
    meal_name: m.meal_name,
    meal_order: m.meal_order,
    equivalent_id: m.equivalent_id ?? null,
    servings: m.servings ?? 1,
    notes: m.notes ?? null,
  }))

  const { error: insertErr } = await admin.from('plan_meals').insert(rows)
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ cloned: rows.length })
}
