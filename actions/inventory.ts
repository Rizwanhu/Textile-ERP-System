'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/db/auth'
import type { InventoryItem, StockMovement, StockMovementType } from '@/data/inventory'
import { INVENTORY as MOCK_INVENTORY, STOCK_HISTORY as MOCK_HISTORY } from '@/data/inventory'

type DbInventory = {
  id: string
  material_name: string
  material_type: string
  current_stock: number
  unit: string
  reorder_level: number
  last_updated: string
  sku: string | null
  category: string | null
  unit_cost: number
  location: string | null
}

type DbHistory = {
  id: string
  inventory_id: string
  order_id: string | null
  change_amount: number
  reason: string
  created_at: string
  movement_type: StockMovementType | null
  reference: string | null
  user_name: string | null
  notes: string | null
}

function mapInventory(row: DbInventory): InventoryItem {
  return {
    id: row.id,
    sku: row.sku ?? row.material_type,
    name: row.material_name,
    category: (row.category ?? row.material_type) as InventoryItem['category'],
    unit: row.unit as InventoryItem['unit'],
    inStock: Number(row.current_stock),
    reorderLevel: Number(row.reorder_level),
    unitCost: Number(row.unit_cost ?? 0),
    location: row.location ?? '—',
    lastUpdated: row.last_updated?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  }
}

function mapHistory(row: DbHistory): StockMovement {
  return {
    id: row.id,
    date: row.created_at.slice(0, 10),
    itemId: row.inventory_id,
    type: row.movement_type ?? 'adjust',
    qty: Math.abs(Number(row.change_amount)),
    reference: row.reference ?? row.order_id ?? row.reason,
    user: row.user_name ?? 'System',
    notes: row.notes ?? undefined,
  }
}

export async function fetchInventoryFromDb(): Promise<{
  items: InventoryItem[]
  history: StockMovement[]
} | null> {
  const { user, error } = await requireUser()
  if (error || !user) return null

  const supabase = await createClient()

  const { data: items, error: itemsError } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .order('material_name')

  if (itemsError) {
    console.error('fetchInventoryFromDb:', itemsError.message)
    return null
  }

  const itemIds = (items ?? []).map((i) => i.id)
  let history: DbHistory[] = []

  if (itemIds.length) {
    const { data: hist, error: histError } = await supabase
      .from('inventory_history')
      .select('*')
      .in('inventory_id', itemIds)
      .order('created_at', { ascending: false })
      .limit(100)

    if (histError) console.error('fetchInventory history:', histError.message)
    else history = (hist ?? []) as DbHistory[]
  }

  return {
    items: (items ?? []).map((r) => mapInventory(r as DbInventory)),
    history: history.map(mapHistory),
  }
}

export async function fetchInventoryHybrid() {
  const fromDb = await fetchInventoryFromDb()
  if (fromDb === null) return { items: MOCK_INVENTORY, history: MOCK_HISTORY, source: 'mock' as const }
  return { ...fromDb, source: 'supabase' as const }
}

export async function updateInventoryItem(
  itemId: string,
  input: Partial<{
    sku: string
    name: string
    category: InventoryItem['category']
    unit: InventoryItem['unit']
    reorderLevel: number
    unitCost: number
    location: string
  }>,
): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const patch: Record<string, unknown> = { last_updated: new Date().toISOString() }
  if (input.sku !== undefined) patch.sku = input.sku
  if (input.name !== undefined) patch.material_name = input.name
  if (input.category !== undefined) {
    patch.category = input.category
    patch.material_type = input.category
  }
  if (input.unit !== undefined) patch.unit = input.unit
  if (input.reorderLevel !== undefined) patch.reorder_level = input.reorderLevel
  if (input.unitCost !== undefined) patch.unit_cost = input.unitCost
  if (input.location !== undefined) patch.location = input.location

  const { error: dbError } = await supabase
    .from('inventory')
    .update(patch)
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/inventory')
  revalidatePath('/')
  return { success: true }
}

export async function createInventoryItem(input: {
  sku: string
  name: string
  category: InventoryItem['category']
  unit: InventoryItem['unit']
  inStock: number
  reorderLevel: number
  unitCost: number
  location: string
}): Promise<{ id: string } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const { data, error: dbError } = await supabase
    .from('inventory')
    .insert({
      user_id: user.id,
      material_name: input.name,
      material_type: input.category,
      sku: input.sku,
      category: input.category,
      current_stock: input.inStock,
      unit: input.unit,
      reorder_level: input.reorderLevel,
      unit_cost: input.unitCost,
      location: input.location,
      last_updated: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (dbError) return { error: dbError.message }

  if (input.inStock > 0) {
    await supabase.from('inventory_history').insert({
      inventory_id: data.id,
      change_amount: input.inStock,
      reason: 'Initial stock',
      movement_type: 'in',
      reference: 'OPENING',
      user_name: user.name,
    })
  }

  revalidatePath('/inventory')
  revalidatePath('/')
  return { id: data.id }
}

export async function updateInventoryStock(input: {
  itemId: string
  type: StockMovementType
  qty: number
  reference: string
  notes?: string
  orderId?: string
}): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const { data: item, error: fetchError } = await supabase
    .from('inventory')
    .select('current_stock')
    .eq('id', input.itemId)
    .eq('user_id', user.id)
    .single()

  if (fetchError) return { error: fetchError.message }

  const current = Number(item.current_stock)
  const delta =
    input.type === 'out' || input.type === 'adjust' ? -Math.abs(input.qty) : Math.abs(input.qty)
  const next = Math.max(0, current + delta)

  const { error: updateError } = await supabase
    .from('inventory')
    .update({ current_stock: next, last_updated: new Date().toISOString() })
    .eq('id', input.itemId)
    .eq('user_id', user.id)

  if (updateError) return { error: updateError.message }

  await supabase.from('inventory_history').insert({
    inventory_id: input.itemId,
    order_id: input.orderId ?? null,
    change_amount: delta,
    reason: input.reference,
    movement_type: input.type,
    reference: input.reference,
    user_name: user.name,
    notes: input.notes ?? null,
  })

  revalidatePath('/inventory')
  revalidatePath('/')
  return { success: true }
}

export async function deleteInventoryItem(
  itemId: string
): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const { error: dbError } = await supabase
    .from('inventory')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/inventory')
  return { success: true }
}
