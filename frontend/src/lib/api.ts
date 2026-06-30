import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

const ACCESS_KEY = 'crm.accessToken'
const REFRESH_KEY = 'crm.refreshToken'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// Cliente HTTP centralizado. En desarrollo, Vite redirige /api al backend.
export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el access token en cada petición.
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Un único refresco en vuelo, compartido por todas las peticiones que reciban
// 401 a la vez. Se limpia al resolverse para permitir futuros refrescos.
let refreshing: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No hay refresh token')
  // Petición con axios "pelado" para no entrar en el interceptor (evita bucles).
  const { data } = await axios.post<{
    accessToken: string
    refreshToken: string
  }>(`${baseURL}/auth/refresh`, { refreshToken })
  setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

// Ante un 401, intenta renovar el token una vez y reintenta la petición. Si el
// refresco falla, limpia la sesión y avisa a la app para redirigir al login.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const status = error.response?.status
    const url = original?.url ?? ''
    const isAuthRoute = url.includes('/auth/')

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true
      try {
        const newToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        clearTokens()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
