'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/session'

export async function updateProfileAction(input: {
  name?: string
  role?: 'Owner' | 'Manager' | 'Operator' | 'Viewer'
}) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
    })
    .eq('id', sessionUser.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true as const }
}

export async function updateWorkspaceSettingsAction(input: {
  factoryName?: string
  address?: string
  phone?: string
  email?: string
  bankDetails?: string
}) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_settings')
    .update({
      ...(input.factoryName !== undefined ? { factory_name: input.factoryName } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.bankDetails !== undefined ? { bank_details: input.bankDetails } : {}),
    })
    .eq('user_id', sessionUser.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true as const }
}

export async function fetchWorkspaceSettingsAction() {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspace_settings')
    .select('*')
    .eq('user_id', sessionUser.id)
    .maybeSingle()

  if (error) {
    console.error('fetchWorkspaceSettingsAction:', error.message)
    return null
  }

  return data
}
