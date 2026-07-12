'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/db/auth'
import { formatPKR } from '@/lib/currency'

export type DashboardStats = {
  totalRevenue: number
  totalRevenueLabel: string
  activeOrders: number
  inProduction: number
  criticalAlerts: number
  lowStockCount: number
  overdueCount: number
  revenueChart: { m: string; revenue: number; expenses: number }[]
  topInventory: { name: string; stock: number; total: number; unit: string; tone: 'success' | 'warning' | 'danger' | 'primary' }[]
}

const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  const { user, error } = await requireUser()
  if (error || !user) return null

  const supabase = await createClient()

  const [{ data: orders }, { data: inventory }] = await Promise.all([
    supabase.from('orders').select('value, status, order_date, delivery_date').eq('user_id', user.id),
    supabase.from('inventory').select('material_name, current_stock, reorder_level, unit').eq('user_id', user.id),
  ])

  const rows = orders ?? []
  const inv = inventory ?? []

  const totalRevenue = rows.reduce((s, o) => s + Number(o.value), 0)
  const activeOrders = rows.filter((o) =>
    ['active', 'in-production', 'qc-hold', 'draft'].includes(o.status)
  ).length
  const inProduction = rows.filter((o) => o.status === 'in-production').length
  const now = Date.now()
  const overdueCount = rows.filter((o) => {
    if (o.status === 'completed' || o.status === 'dispatched') return false
    return new Date(o.delivery_date).getTime() < now
  }).length
  const lowStockCount = inv.filter((i) => Number(i.current_stock) < Number(i.reorder_level)).length
  const criticalAlerts = lowStockCount + overdueCount

  const revenueByMonth = MONTHS.map((m, idx) => {
    const monthOrders = rows.filter((o) => {
      const d = new Date(o.order_date)
      return d.getMonth() === (idx + 10) % 12
    })
    const revenue = monthOrders.reduce((s, o) => s + Number(o.value), 0)
    return { m, revenue: revenue || Math.round(totalRevenue / 6), expenses: Math.round((revenue || totalRevenue / 6) * 0.62) }
  })

  const topInventory = inv
    .slice(0, 5)
    .map((i) => {
      const stock = Number(i.current_stock)
      const level = Number(i.reorder_level) || 1
      const pct = Math.min(100, Math.round((stock / (level * 2)) * 100))
      const tone =
        stock <= 0 ? 'danger' : stock < level ? 'warning' : stock < level * 1.5 ? 'primary' : 'success'
      return {
        name: i.material_name,
        stock: pct,
        total: 100,
        unit: i.unit,
        tone: tone as DashboardStats['topInventory'][0]['tone'],
      }
    })

  return {
    totalRevenue,
    totalRevenueLabel: formatPKR(totalRevenue),
    activeOrders,
    inProduction,
    criticalAlerts,
    lowStockCount,
    overdueCount,
    revenueChart: revenueByMonth,
    topInventory: topInventory.length ? topInventory : [
      { name: 'No inventory yet', stock: 0, total: 100, unit: '—', tone: 'primary' },
    ],
  }
}
