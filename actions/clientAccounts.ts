'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/db/auth'
import { SEED_CLIENT_ACCOUNT_DATA } from '@/data/clients'
import { nextCreditNoteNumber, nextInvoiceNumber } from '@/lib/clientAccount'
import { computeLineValue, convertToBillingCurrency } from '@/lib/currency'
import type {
  BillingCurrency,
  Client,
  ClientAccountData,
  ClientLineItem,
  CreditNote,
  FulfillmentStatus,
  Invoice,
  LineItemType,
  Payment,
  PaymentMethod,
} from '@/types/clientAccount'

type DbClient = {
  id: string
  slug: string | null
  name: string
  type: 'export' | 'local'
  billing_currency: 'GBP' | 'PKR' | 'USD'
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  billing_address: string | null
  opening_balance: number
  opening_balance_date: string | null
  opening_balance_note: string | null
  created_at: string
}

type DbLineItem = {
  id: string
  client_id: string
  order_id: string | null
  serial_number: number
  description: string
  quantity: number
  unit_price: number
  currency: 'GBP' | 'PKR' | 'USD'
  exchange_rate: number
  invoice_value: number
  input_amount: number | null
  type: LineItemType
  fulfillment_status: FulfillmentStatus
  invoiced: boolean
  invoice_id: string | null
  credit_note_id: string | null
  order_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

type DbInvoice = {
  id: string
  client_id: string
  invoice_number: string
  line_item_ids: string[]
  subtotal: number
  opening_balance_included: number
  total: number
  currency: 'GBP' | 'PKR' | 'USD'
  status: 'draft' | 'issued' | 'void'
  issued_at: string | null
  notes: string | null
  created_at: string
}

type DbPayment = {
  id: string
  client_id: string
  date: string
  amount: number
  billing_currency: 'GBP' | 'PKR' | 'USD'
  input_currency: 'GBP' | 'PKR' | 'USD'
  input_amount: number
  exchange_rate: number
  description: string
  method: PaymentMethod | null
  reference: string | null
  created_at: string
}

type DbCreditNote = {
  id: string
  client_id: string
  credit_note_number: string
  line_item_id: string | null
  invoice_id: string | null
  amount: number
  currency: 'GBP' | 'PKR' | 'USD'
  exchange_rate: number
  reason: string
  issued_at: string
  created_at: string
}

function toBillingCurrency(value: 'GBP' | 'PKR' | 'USD'): BillingCurrency {
  return value === 'GBP' ? 'GBP' : 'PKR'
}

function mapClient(row: DbClient): Client {
  const contact =
    row.contact_name || row.contact_email || row.contact_phone
      ? {
          name: row.contact_name ?? '',
          email: row.contact_email ?? '',
          phone: row.contact_phone ?? '',
        }
      : undefined

  return {
    id: row.id,
    slug: row.slug ?? undefined,
    name: row.name,
    type: row.type,
    billingCurrency: toBillingCurrency(row.billing_currency),
    contact,
    billingAddress: row.billing_address ?? undefined,
    openingBalance: Number(row.opening_balance),
    openingBalanceDate: row.opening_balance_date ?? undefined,
    openingBalanceNote: row.opening_balance_note ?? undefined,
    createdAt: row.created_at,
  }
}

function mapLineItem(row: DbLineItem): ClientLineItem {
  return {
    id: row.id,
    clientId: row.client_id,
    orderId: row.order_id ?? undefined,
    serialNumber: row.serial_number,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    currency: toBillingCurrency(row.currency),
    exchangeRate: Number(row.exchange_rate),
    invoiceValue: Number(row.invoice_value),
    inputAmount: row.input_amount != null ? Number(row.input_amount) : undefined,
    type: row.type,
    fulfillmentStatus: row.fulfillment_status,
    invoiced: row.invoiced,
    invoiceId: row.invoice_id ?? undefined,
    creditNoteId: row.credit_note_id ?? undefined,
    orderDate: row.order_date ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapInvoice(row: DbInvoice): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientId: row.client_id,
    lineItemIds: row.line_item_ids ?? [],
    subtotal: Number(row.subtotal),
    openingBalanceIncluded: Number(row.opening_balance_included),
    total: Number(row.total),
    currency: toBillingCurrency(row.currency),
    status: row.status,
    issuedAt: row.issued_at ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

function mapPayment(row: DbPayment): Payment {
  return {
    id: row.id,
    clientId: row.client_id,
    date: row.date,
    amount: Number(row.amount),
    billingCurrency: toBillingCurrency(row.billing_currency),
    inputCurrency: toBillingCurrency(row.input_currency),
    inputAmount: Number(row.input_amount),
    exchangeRate: Number(row.exchange_rate),
    description: row.description,
    method: row.method ?? undefined,
    reference: row.reference ?? undefined,
    createdAt: row.created_at,
  }
}

function mapCreditNote(row: DbCreditNote): CreditNote {
  return {
    id: row.id,
    creditNoteNumber: row.credit_note_number,
    clientId: row.client_id,
    lineItemId: row.line_item_id ?? undefined,
    invoiceId: row.invoice_id ?? undefined,
    amount: Number(row.amount),
    currency: toBillingCurrency(row.currency),
    exchangeRate: Number(row.exchange_rate),
    reason: row.reason,
    issuedAt: row.issued_at.slice(0, 10),
    createdAt: row.created_at,
  }
}

function revalidateClientPaths() {
  revalidatePath('/orders')
  revalidatePath('/orders/clients/[clientId]', 'page')
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `client_${base || Date.now().toString(36)}`
}

function isSlugColumnError(message?: string): boolean {
  return !!message?.toLowerCase().includes('slug')
}

type ClientInsertPayload = {
  user_id: string
  name: string
  type: 'export' | 'local'
  billing_currency: 'GBP' | 'PKR' | 'USD'
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  billing_address: string | null
  opening_balance: number
  opening_balance_date: string | null
  opening_balance_note: string | null
}

async function insertClientRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: ClientInsertPayload,
  slug?: string,
): Promise<{ id: string; slug?: string } | { error: string }> {
  if (slug) {
    const withSlug = await supabase
      .from('clients')
      .insert({ ...payload, slug })
      .select('id, slug')
      .single()

    if (!withSlug.error && withSlug.data) {
      return { id: withSlug.data.id, slug: withSlug.data.slug ?? undefined }
    }
    if (!isSlugColumnError(withSlug.error?.message)) {
      return { error: withSlug.error?.message ?? 'Failed to create client' }
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) return { error: error?.message ?? 'Failed to create client' }
  return { id: data.id }
}

async function ensureSeedClients(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { count, error: countError } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    console.error('ensureSeedClients count:', countError.message)
    return
  }
  if (count && count > 0) return

  const slugToId = new Map<string, string>()

  for (const seed of SEED_CLIENT_ACCOUNT_DATA.clients) {
    const result = await insertClientRow(
      supabase,
      {
        user_id: userId,
        name: seed.name,
        type: seed.type,
        billing_currency: seed.billingCurrency,
        contact_name: seed.contact?.name ?? null,
        contact_email: seed.contact?.email ?? null,
        contact_phone: seed.contact?.phone ?? null,
        billing_address: seed.billingAddress ?? null,
        opening_balance: seed.openingBalance,
        opening_balance_date: seed.openingBalanceDate ?? null,
        opening_balance_note: seed.openingBalanceNote ?? null,
      },
      seed.id,
    )

    if ('error' in result) {
      console.error('ensureSeedClients client:', result.error)
      continue
    }
    slugToId.set(seed.id, result.id)
  }

  const lineRows = SEED_CLIENT_ACCOUNT_DATA.lineItems.flatMap((line) => {
    const clientId = slugToId.get(line.clientId)
    if (!clientId) return []
    return [{
      user_id: userId,
      client_id: clientId,
      order_id: line.orderId ?? null,
      serial_number: line.serialNumber,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      currency: line.currency,
      exchange_rate: line.exchangeRate,
      invoice_value: line.invoiceValue,
      input_amount: line.inputAmount ?? line.quantity * line.unitPrice,
      type: line.type,
      fulfillment_status: line.fulfillmentStatus,
      invoiced: line.invoiced,
      order_date: line.orderDate ?? null,
    }]
  })

  if (lineRows.length) {
    const { error } = await supabase.from('client_line_items').insert(lineRows)
    if (error) console.error('ensureSeedClients lines:', error.message)
  }

  const paymentRows = SEED_CLIENT_ACCOUNT_DATA.payments.flatMap((payment) => {
    const clientId = slugToId.get(payment.clientId)
    if (!clientId) return []
    return [{
      user_id: userId,
      client_id: clientId,
      date: payment.date,
      amount: payment.amount,
      billing_currency: payment.billingCurrency,
      input_currency: payment.inputCurrency,
      input_amount: payment.inputAmount,
      exchange_rate: payment.exchangeRate,
      description: payment.description,
      method: payment.method ?? null,
      reference: payment.reference ?? null,
    }]
  })

  if (paymentRows.length) {
    const { error } = await supabase.from('payments').insert(paymentRows)
    if (error) console.error('ensureSeedClients payments:', error.message)
  }
}

export async function fetchClientAccountData(): Promise<ClientAccountData | null> {
  const { user, error } = await requireUser()
  if (error || !user) return null

  const supabase = await createClient()
  await ensureSeedClients(supabase, user.id)

  const [clientsRes, linesRes, invoicesRes, paymentsRes, creditNotesRes] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('client_line_items').select('*').eq('user_id', user.id).order('serial_number'),
    supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    supabase.from('credit_notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  if (clientsRes.error) {
    console.error('fetchClientAccountData clients:', clientsRes.error.message)
    return null
  }

  return {
    clients: (clientsRes.data ?? []).map((row) => mapClient(row as DbClient)),
    lineItems: (linesRes.data ?? []).map((row) => mapLineItem(row as DbLineItem)),
    invoices: (invoicesRes.data ?? []).map((row) => mapInvoice(row as DbInvoice)),
    payments: (paymentsRes.data ?? []).map((row) => mapPayment(row as DbPayment)),
    creditNotes: (creditNotesRes.data ?? []).map((row) => mapCreditNote(row as DbCreditNote)),
  }
}

export async function fetchClientAccountDataHybrid(): Promise<{
  data: ClientAccountData
  source: 'supabase' | 'mock'
}> {
  const fromDb = await fetchClientAccountData()
  if (fromDb) return { data: fromDb, source: 'supabase' }
  return { data: structuredClone(SEED_CLIENT_ACCOUNT_DATA), source: 'mock' }
}

export async function createClientAccount(
  input: Omit<Client, 'id' | 'createdAt' | 'slug'> & { slug?: string },
): Promise<{ id: string; slug?: string } | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const slug = input.slug ?? slugify(input.name)

  const result = await insertClientRow(
    supabase,
    {
      user_id: user.id,
      name: input.name,
      type: input.type,
      billing_currency: input.billingCurrency,
      contact_name: input.contact?.name ?? null,
      contact_email: input.contact?.email ?? null,
      contact_phone: input.contact?.phone ?? null,
      billing_address: input.billingAddress ?? null,
      opening_balance: input.openingBalance ?? 0,
      opening_balance_date: input.openingBalanceDate ?? null,
      opening_balance_note: input.openingBalanceNote ?? null,
    },
    slug,
  )

  if ('error' in result) return { error: result.error }

  revalidateClientPaths()
  return result
}

export async function updateClientAccount(
  clientId: string,
  patch: Partial<Omit<Client, 'id' | 'createdAt'>>,
): Promise<{ error?: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const update: Record<string, unknown> = {}

  if (patch.name != null) update.name = patch.name
  if (patch.type != null) update.type = patch.type
  if (patch.billingCurrency != null) update.billing_currency = patch.billingCurrency
  if (patch.contact !== undefined) {
    update.contact_name = patch.contact?.name ?? null
    update.contact_email = patch.contact?.email ?? null
    update.contact_phone = patch.contact?.phone ?? null
  }
  if (patch.billingAddress !== undefined) update.billing_address = patch.billingAddress ?? null
  if (patch.openingBalance != null) update.opening_balance = patch.openingBalance
  if (patch.openingBalanceDate !== undefined) update.opening_balance_date = patch.openingBalanceDate ?? null
  if (patch.openingBalanceNote !== undefined) update.opening_balance_note = patch.openingBalanceNote ?? null

  const { error: dbError } = await supabase
    .from('clients')
    .update(update)
    .eq('id', clientId)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  revalidateClientPaths()
  return {}
}

async function resolveClientId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  clientRef: string,
): Promise<string | null> {
  const { data: byId } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .eq('id', clientRef)
    .maybeSingle()
  if (byId) return byId.id

  const { data: bySlug, error: slugError } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .eq('slug', clientRef)
    .maybeSingle()
  if (!slugError && bySlug) return bySlug.id
  if (slugError && !isSlugColumnError(slugError.message)) {
    console.error('resolveClientId slug:', slugError.message)
  }
  return null
}

export async function createClientLineItem(input: {
  clientId: string
  description: string
  quantity: number
  unitPrice: number
  inputCurrency: BillingCurrency
  exchangeRate: number
  fulfillmentStatus?: FulfillmentStatus
  orderId?: string
  orderDate?: string
}): Promise<{ error?: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const clientUuid = await resolveClientId(supabase, user.id, input.clientId)
  if (!clientUuid) return { error: 'Client not found' }

  const { data: client } = await supabase
    .from('clients')
    .select('billing_currency')
    .eq('id', clientUuid)
    .single()

  if (!client) return { error: 'Client not found' }

  const billingCurrency = toBillingCurrency(client.billing_currency as 'GBP' | 'PKR' | 'USD')
  const invoiceValue = computeLineValue(
    input.quantity,
    input.unitPrice,
    input.inputCurrency,
    billingCurrency,
    input.exchangeRate,
  )

  const { data: existing } = await supabase
    .from('client_line_items')
    .select('serial_number')
    .eq('client_id', clientUuid)
    .eq('user_id', user.id)

  const serialNumber =
    (existing ?? []).reduce((max, row) => Math.max(max, row.serial_number), 0) + 1

  const type: LineItemType = input.description.toLowerCase().includes('courier') ? 'service' : 'product'

  const { error: dbError } = await supabase.from('client_line_items').insert({
    user_id: user.id,
    client_id: clientUuid,
    order_id: input.orderId ?? null,
    serial_number: serialNumber,
    description: input.description,
    quantity: input.quantity,
    unit_price: input.unitPrice,
    currency: input.inputCurrency,
    exchange_rate: input.exchangeRate,
    invoice_value: invoiceValue,
    input_amount: input.quantity * input.unitPrice,
    type,
    fulfillment_status: input.fulfillmentStatus ?? 'in-process',
    order_date: input.orderDate ?? new Date().toISOString().slice(0, 10),
  })

  if (dbError) return { error: dbError.message }

  revalidateClientPaths()
  return {}
}

export async function updateClientLineItemStatus(
  lineId: string,
  status: FulfillmentStatus,
): Promise<{ error?: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error: dbError } = await supabase
    .from('client_line_items')
    .update({ fulfillment_status: status })
    .eq('id', lineId)
    .eq('user_id', user.id)

  if (dbError) return { error: dbError.message }

  revalidateClientPaths()
  return {}
}

export async function createClientPayment(input: {
  clientId: string
  date: string
  inputAmount: number
  inputCurrency: BillingCurrency
  exchangeRate: number
  description?: string
  method?: PaymentMethod
  reference?: string
}): Promise<{ error?: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const clientUuid = await resolveClientId(supabase, user.id, input.clientId)
  if (!clientUuid) return { error: 'Client not found' }

  const { data: client } = await supabase
    .from('clients')
    .select('billing_currency, name')
    .eq('id', clientUuid)
    .single()

  if (!client) return { error: 'Client not found' }

  const billingCurrency = toBillingCurrency(client.billing_currency as 'GBP' | 'PKR' | 'USD')
  const amount = convertToBillingCurrency(
    input.inputAmount,
    input.inputCurrency,
    billingCurrency,
    input.exchangeRate,
  )

  const { error: dbError } = await supabase.from('payments').insert({
    user_id: user.id,
    client_id: clientUuid,
    date: input.date,
    amount: +amount.toFixed(2),
    billing_currency: billingCurrency,
    input_currency: input.inputCurrency,
    input_amount: input.inputAmount,
    exchange_rate: input.exchangeRate,
    description:
      input.description ??
      `Payment received ${new Date(input.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
    method: input.method ?? 'bank_transfer',
    reference: input.reference ?? null,
  })

  if (dbError) return { error: dbError.message }

  revalidateClientPaths()
  return {}
}

export async function createClientInvoice(
  clientId: string,
  lineItemIds: string[],
  notes?: string,
): Promise<Invoice | { error: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const clientUuid = await resolveClientId(supabase, user.id, clientId)
  if (!clientUuid) return { error: 'Client not found' }

  const [{ data: client }, { data: lines }, { data: invoices }] = await Promise.all([
    supabase.from('clients').select('billing_currency').eq('id', clientUuid).single(),
    supabase
      .from('client_line_items')
      .select('*')
      .eq('client_id', clientUuid)
      .eq('user_id', user.id)
      .in('id', lineItemIds)
      .eq('invoiced', false),
    supabase.from('invoices').select('invoice_number').eq('user_id', user.id),
  ])

  if (!client) return { error: 'Client not found' }
  const selected = (lines ?? []) as DbLineItem[]
  if (!selected.length) return { error: 'No uninvoiced lines selected' }

  const billingCurrency = toBillingCurrency(client.billing_currency as 'GBP' | 'PKR' | 'USD')
  const subtotal = +selected.reduce((s, l) => s + Number(l.invoice_value), 0).toFixed(2)
  const invoiceNumber = nextInvoiceNumber((invoices ?? []).map((i) => mapInvoice(i as DbInvoice)))

  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: clientUuid,
      invoice_number: invoiceNumber,
      line_item_ids: selected.map((l) => l.id),
      subtotal,
      opening_balance_included: 0,
      total: subtotal,
      currency: billingCurrency,
      status: 'issued',
      issued_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .select('*')
    .single()

  if (invError || !invoice) return { error: invError?.message ?? 'Failed to create invoice' }

  const { error: lineError } = await supabase
    .from('client_line_items')
    .update({ invoiced: true, invoice_id: invoice.id })
    .in('id', selected.map((l) => l.id))
    .eq('user_id', user.id)

  if (lineError) return { error: lineError.message }

  revalidateClientPaths()
  return mapInvoice(invoice as DbInvoice)
}

export async function createClientCreditNote(input: {
  clientId: string
  lineItemId?: string
  amount: number
  exchangeRate: number
  reason: string
}): Promise<{ error?: string }> {
  const { user, error } = await requireUser()
  if (error || !user) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const clientUuid = await resolveClientId(supabase, user.id, input.clientId)
  if (!clientUuid) return { error: 'Client not found' }

  const [{ data: client }, { data: creditNotes }] = await Promise.all([
    supabase.from('clients').select('billing_currency').eq('id', clientUuid).single(),
    supabase.from('credit_notes').select('credit_note_number').eq('user_id', user.id),
  ])

  if (!client) return { error: 'Client not found' }

  const billingCurrency = toBillingCurrency(client.billing_currency as 'GBP' | 'PKR' | 'USD')
  const creditNoteNumber = nextCreditNoteNumber(
    (creditNotes ?? []).map((c) => mapCreditNote(c as DbCreditNote)),
  )

  const { data: cn, error: cnError } = await supabase
    .from('credit_notes')
    .insert({
      user_id: user.id,
      client_id: clientUuid,
      credit_note_number: creditNoteNumber,
      line_item_id: input.lineItemId ?? null,
      amount: +input.amount.toFixed(2),
      currency: billingCurrency,
      exchange_rate: input.exchangeRate,
      reason: input.reason,
      issued_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (cnError || !cn) return { error: cnError?.message ?? 'Failed to create credit note' }

  if (input.lineItemId) {
    await supabase
      .from('client_line_items')
      .update({ fulfillment_status: 'cancelled', credit_note_id: cn.id })
      .eq('id', input.lineItemId)
      .eq('user_id', user.id)
  }

  revalidateClientPaths()
  return {}
}
