import { getSessionUser } from '@/lib/auth/session'

export async function requireUser() {
  const user = await getSessionUser()
  if (!user) return { error: 'Not authenticated' as const, user: null }
  return { user, error: null }
}
