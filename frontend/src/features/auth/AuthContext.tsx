import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { clearTokens, getAccessToken } from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'
import * as authApi from './api'
import type { User } from './types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // Al cargar, si hay token guardado, hidrata el usuario validándolo con /me.
  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false)
      return
    }
    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // El cliente HTTP emite este evento si el refresh falla: cerramos sesión.
  useEffect(() => {
    const onLogout = () => {
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [queryClient])

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authApi.login(email, password))
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setUser(await authApi.register(name, email, password))
    },
    [],
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
