import { createClient } from '@/lib/supabase/server'
import type { AuthUser } from '@/context/AuthContext'

export async function getSessionUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role as AuthUser['role'],
    }
  }

  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    name: (meta.name as string) || user.email?.split('@')[0] || 'User',
    email: user.email ?? '',
    role: 'Owner',
  }
}
