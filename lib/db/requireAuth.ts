import { getSessionUser } from '@/lib/auth/session'

export async function requireUserId(): Promise<string | null> {
  const user = await getSessionUser()
  return user?.id ?? null
}
