import { api, getRefreshToken, setTokens } from '../../lib/api'
import type { AuthResponse, User } from './types'

/** Inicia sesión, guarda los tokens y devuelve el usuario. */
export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  })
  setTokens(data.accessToken, data.refreshToken)
  return data.user
}

/** Registra una cuenta, guarda los tokens y devuelve el usuario. */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    name,
    email,
    password,
  })
  setTokens(data.accessToken, data.refreshToken)
  return data.user
}

/** Recupera el perfil del usuario autenticado (valida el token). */
export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

/** Revoca el refresh token actual en el servidor (best-effort). */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return
  try {
    await api.post('/auth/logout', { refreshToken })
  } catch {
    // El cierre de sesión local no debe fallar si la revocación no llega.
  }
}
