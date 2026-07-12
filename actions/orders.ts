'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/db/auth'
import { revalidateOrders } from '@/lib/db/revalidate'
import type { Order, OrderDetail, SizeBreakdown, TimelineEvent } from '@/data/orders'
import { getOrderDetail as getMockOrderDetail } from '@/data/orders'
import type { OrderStatus } from '@/components/dashboard/StatusBadge'

type DbOrderRow = {
  id: string
  client_name: string
  product: string
  qty: number
  value: number
  order_date: string
  delivery_date: string
  status: string
  po_number: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  ship_to: string | null
  fabric: string | null
  notes: string | null
  produced: number
  rejected: number
  packed: number
}

function mapOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    client: row.client_name,
    product: row.product,
    qty: row.qty,
    value: Number(row.value),
    orderDate: row.order_date,
    deliveryDate: row.delivery_date,
    status: row.status as Order['status'],
  }
}

export async function fetchOrdersFromDb(): Promise<Order[] | null> {
  const { user, error } = await requireUser()
  if (error || !user) return null

  const supabase = await createClient()
  const { data, error: dbError } = await supabase
    .from('orders')
    .select('id, client_name, product, qty, value, order_date, delivery_date, status')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })

  if (dbError) {
    console.error('fetchOrdersFromDb:', dbError.message)
    return null
  }

  return (data ?? []).map((row) => mapOrder(row as DbOrderRow))
}

export async function fetchOrderDetailFromDb(orderId: string): Promise<OrderDetail | null> {
  const { user, error } = await requireUser()
  if (error || !user) return null

  const supabase = await createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (orderError) {
    console.error('fetchOrderDetailFromDb:', orderError.message)
    return null
  }
  if (!order) return null

  const [{ data: breakdown }, { data: timeline }] = await Promise.all([
    supabase.from('order_size_breakdown').select('*').eq('order_id', orderId),
    supabase.from('order_timeline').select('*').eq('order_id', orderId).order('sort_order'),
  ])

  const base = mapOrder(order as DbOrderRow)
  const rows: SizeBreakdown[] = (breakdown ?? []).map((b) => ({
    size: b.size,
    color: b.color,
    qty: b.qty,
    rate: Number(b.rate),
  }))

  const events: TimelineEvent[] = (timeline ?? []).map((t) => ({
    key: t.step_key as TimelineEvent['key'],
    label: t.label,
    date: t.planned_date ?? undefined,
    actualDate: t.actual_date ?? undefined,
    note: t.note ?? undefined,
  }))

  return {
    ...base,
    poNumber: order.po_number ?? `PO-${order.id.split('-').slice(1).join('-')}`,
    contact: {
      name: order.contact_name ?? '—',
      email: order.contact_email ?? '—',
      phone: order.contact_phone ?? '—',
    },
    shipTo: order.ship_to ?? '—',
    fabric: order.fabric ?? base.product.split('—')[1]?.trim() ?? '—',
    notes: order.notes ?? '',
    breakdown: rows,
    timeline: events,
    produced: order.produced ?? 0,
    rejected: order.rejected ?? 0,
    packed: order.packed ?? 0,
  }
}

export async function getOrderDetailHybrid(orderId: string): Promise<OrderDetail | undefined> {
  const fromDb = await fetchOrderDetailFromDb(orderId)
  if (fromDb) return fromDb
  return getMockOrderDetail(orderId)
}

export async function createOrderInDb(input: {
  clientName: string
  product: string
  qty: number
  value: number
  orderDate: string
  deliveryDate: string
  status?: Order['status']
  poNumber?: string
  fabric?: string
  notes?: string
}): Promise<{ id: string } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const { data: orderNumber, error: seqError } = await supabase.rpc('next_order_number', {
    p_user_id: user.id,
  })

  if (seqError || !orderNumber) {
    return { error: seqError?.message ?? 'Could not generate order number' }
  }

  const { error: insertError } = await supabase.from('orders').insert({
    id: orderNumber,
    user_id: user.id,
    client_name: input.clientName,
    product: input.product,
    qty: input.qty,
    value: input.value,
    order_date: input.orderDate,
    delivery_date: input.deliveryDate || input.orderDate,
    status: input.status ?? 'draft',
    po_number: input.poNumber ?? null,
    fabric: input.fabric ?? null,
    notes: input.notes ?? null,
  })

  if (insertError) return { error: insertError.message }

  await supabase.from('materials').insert({
    user_id: user.id,
    order_id: orderNumber,
    pipeline_step: 1,
    pipeline_status: 'pending',
  })

  const timeline = [
    { step_key: 'received', label: 'Order Received', planned_date: input.orderDate, sort_order: 0 },
    { step_key: 'draft', label: 'Drafted', sort_order: 1 },
    { step_key: 'active', label: 'Activated', sort_order: 2 },
  ]
  await supabase.from('order_timeline').insert(
    timeline.map((t) => ({ ...t, order_id: orderNumber }))
  )

  revalidateOrders()
  return { id: orderNumber }
}

export async function updateOrderInDb(
  orderId: string,
  input: Partial<{
    clientName: string
    product: string
    qty: number
    value: number
    orderDate: string
    deliveryDate: string
    status: Order['status']
    poNumber: string
    contactName: string
    contactEmail: string
    contactPhone: string
    shipTo: string
    fabric: string
    produced: number
    rejected: number
    packed: number
    notes: string
  }>
): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const patch: Record<string, unknown> = {}
  if (input.clientName !== undefined) patch.client_name = input.clientName
  if (input.product !== undefined) patch.product = input.product
  if (input.qty !== undefined) patch.qty = input.qty
  if (input.value !== undefined) patch.value = input.value
  if (input.orderDate !== undefined) patch.order_date = input.orderDate
  if (input.deliveryDate !== undefined) patch.delivery_date = input.deliveryDate
  if (input.status !== undefined) patch.status = input.status
  if (input.poNumber !== undefined) patch.po_number = input.poNumber
  if (input.contactName !== undefined) patch.contact_name = input.contactName
  if (input.contactEmail !== undefined) patch.contact_email = input.contactEmail
  if (input.contactPhone !== undefined) patch.contact_phone = input.contactPhone
  if (input.shipTo !== undefined) patch.ship_to = input.shipTo
  if (input.fabric !== undefined) patch.fabric = input.fabric
  if (input.produced !== undefined) patch.produced = input.produced
  if (input.rejected !== undefined) patch.rejected = input.rejected
  if (input.packed !== undefined) patch.packed = input.packed
  if (input.notes !== undefined) patch.notes = input.notes

  const { error: dbError } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  revalidateOrders()
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function updateOrderStatusInDb(
  orderId: string,
  status: OrderStatus
): Promise<{ success: true } | { error: string }> {
  return updateOrderInDb(orderId, { status })
}

export async function deleteOrderFromDb(
  orderId: string
): Promise<{ success: true } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Not authenticated' }

  const supabase = await createClient()
  const { error: dbError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  revalidateOrders()
  return { success: true }
}
