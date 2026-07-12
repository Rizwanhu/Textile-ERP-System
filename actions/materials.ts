'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/db/auth'
import type {
  MaterialOrderSummary,
  MaterialRequirement,
  MaterialSource,
  MaterialUnit,
  MaterialCondition,
} from '@/data/materials'
import { MATERIAL_ORDERS as MOCK_MATERIAL_ORDERS } from '@/data/materials'

type DbRequirement = {
  id: string
  order_id: string
  name: string
  category: MaterialRequirement['category']
  required: number
  unit: string
  condition: MaterialCondition
  in_stock: number
  utilized: number
  wastage: number
  unit_cost: number
  source: MaterialSource
  supplier: string | null
}

function mapRequirement(row: DbRequirement): MaterialRequirement {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    required: Number(row.required),
    unit: row.unit as MaterialUnit,
    condition: row.condition,
    inStock: Number(row.in_stock),
    utilized: Number(row.utilized),
    wastage: Number(row.wastage),
    unitCost: Number(row.unit_cost),
    source: row.source,
    supplier: row.supplier ?? undefined,
  }
}

export async function fetchMaterialOrdersFromDb(): Promise<MaterialOrderSummary[] | null> {
  const { user, error } = await requireUser()
  if (error || !user) return null

  const supabase = await createClient()

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, client_name, product, qty')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })

  if (ordersError) {
    console.error('fetchMaterialOrdersFromDb orders:', ordersError.message)
    return null
  }

  const { data: materials, error: matError } = await supabase
    .from('materials')
    .select('order_id, pipeline_status')
    .eq('user_id', user.id)

  if (matError) {
    console.error('fetchMaterialOrdersFromDb materials:', matError.message)
    return null
  }

  const { data: requirements, error: reqError } = await supabase
    .from('material_requirements')
    .select('*')
    .eq('user_id', user.id)

  if (reqError) {
    console.error('fetchMaterialOrdersFromDb requirements:', reqError.message)
    return null
  }

  const statusByOrder = new Map(
    (materials ?? []).map((m) => [m.order_id, m.pipeline_status as MaterialOrderSummary['status']])
  )
  const reqsByOrder = new Map<string, MaterialRequirement[]>()
  for (const row of requirements ?? []) {
    const list = reqsByOrder.get(row.order_id) ?? []
    list.push(mapRequirement(row as DbRequirement))
    reqsByOrder.set(row.order_id, list)
  }

  return (orders ?? []).map((o) => ({
    orderId: o.id,
    client: o.client_name,
    product: o.product,
    qty: o.qty,
    status: statusByOrder.get(o.id) ?? 'pending',
    requirements: reqsByOrder.get(o.id) ?? [],
  }))
}

export async function fetchMaterialOrdersHybrid(): Promise<MaterialOrderSummary[]> {
  const fromDb = await fetchMaterialOrdersFromDb()
  if (fromDb === null) return MOCK_MATERIAL_ORDERS
  if (fromDb.length === 0) return MOCK_MATERIAL_ORDERS
  return fromDb
}

export async function upsertMaterialRequirement(input: {
  id?: string
  orderId: string
  name: string
  category: MaterialRequirement['category']
  required: number
  unit: MaterialUnit
  condition: MaterialCondition
  inStock: number
  utilized?: number
  wastage?: number
  unitCost: number
  source: MaterialSource
  supplier?: string
}): Promise<{ id: string } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const payload = {
    user_id: user.id,
    order_id: input.orderId,
    name: input.name,
    category: input.category,
    required: input.required,
    unit: input.unit,
    condition: input.condition,
    in_stock: input.inStock,
    utilized: input.utilized ?? 0,
    wastage: input.wastage ?? 0,
    unit_cost: input.unitCost,
    source: input.source,
    supplier: input.supplier ?? null,
  }

  if (input.id) {
    const { error: dbError } = await supabase
      .from('material_requirements')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user.id)
    if (dbError) return { error: dbError.message }
    revalidatePath('/materials')
    return { id: input.id }
  }

  const { data, error: dbError } = await supabase
    .from('material_requirements')
    .insert(payload)
    .select('id')
    .single()

  if (dbError) return { error: dbError.message }

  await supabase
    .from('materials')
    .upsert(
      { user_id: user.id, order_id: input.orderId, pipeline_status: 'evaluating' },
      { onConflict: 'order_id' }
    )

  revalidatePath('/materials')
  return { id: data.id }
}

export async function updateMaterialPipelineStatus(
  orderId: string,
  status: MaterialOrderSummary['status'],
  pipelineStep?: number
): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const patch: Record<string, unknown> = { pipeline_status: status }
  if (pipelineStep !== undefined) patch.pipeline_step = pipelineStep

  const { error: dbError } = await supabase
    .from('materials')
    .upsert({ user_id: user.id, order_id: orderId, ...patch }, { onConflict: 'order_id' })

  if (dbError) return { error: dbError.message }

  revalidatePath('/materials')
  return { success: true }
}

export async function deleteMaterialRequirement(
  id: string
): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const { error: dbError } = await supabase
    .from('material_requirements')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/materials')
  return { success: true }
}

export async function updateMaterialUtilization(
  id: string,
  input: { utilized: number; wastage: number }
): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const { data: row, error: fetchError } = await supabase
    .from('material_requirements')
    .select('order_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) return { error: fetchError.message }

  const { error: dbError } = await supabase
    .from('material_requirements')
    .update({ utilized: input.utilized, wastage: input.wastage })
    .eq('id', id)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  await supabase
    .from('materials')
    .upsert(
      { user_id: user.id, order_id: row.order_id, pipeline_status: 'in-use', pipeline_step: 3 },
      { onConflict: 'order_id' }
    )

  revalidatePath('/materials')
  return { success: true }
}
