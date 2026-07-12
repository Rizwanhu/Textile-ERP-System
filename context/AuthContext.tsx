'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Manager' | 'Operator' | 'Viewer'
}

type AuthCtx = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ needsEmailConfirmation: boolean }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

function profileToAuthUser(profile: {
  id: string
  name: string
  email: string
  role: AuthUser['role']
}): AuthUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  }
}

function userToAuthUser(user: User): AuthUser {
  const meta = user.user_metadata ?? {}
  const name =
    (meta.name as string) ||
    user.email?.split('@')[0]?.replace(/[._-]+/g, ' ') ||
    'User'
  return {
    id: user.id,
    name,
    email: user.email ?? '',
    role: 'Owner',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(
    async (authUser: User) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('id', authUser.id)
        .maybeSingle()

      if (error || !data) {
        setUser(userToAuthUser(authUser))
        return
      }

      setUser(
        profileToAuthUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as AuthUser['role'],
        })
      )
    },
    [supabase]
  )

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (authUser) await loadProfile(authUser)
    else setUser(null)
  }, [loadProfile, supabase])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!mounted) return
      if (session?.user) await loadProfile(session.user)
      else setUser(null)
      setIsLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      if (session?.user) await loadProfile(session.user)
      else setUser(null)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile, supabase])

  const login: AuthCtx['login'] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Sign in succeeded but no session was created.')
    await refreshProfile()
  }

  const signup: AuthCtx['signup'] = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw new Error(error.message)

    if (!data.session) {
      return { needsEmailConfirmation: true }
    }

    await refreshProfile()
    return { needsEmailConfirmation: false }
  }

  const logout = async () => {
    setUser(null)
    await supabase.auth.signOut()
    router.refresh()
    window.location.assign('/auth')
  }

  return (
    <Ctx.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  )
}
