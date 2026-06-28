import axios from 'axios'

const ACCESS_TOKEN_KEY = 'crm.accessToken'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token)
  else localStorage.removeItem(ACCESS_TOKEN_KEY)
}

// Cliente HTTP centralizado. En desarrollo, Vite redirige /api al backend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
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

// Manejo básico de 401: limpia el token. La renovación con refresh token
// se implementará junto con el módulo de autenticación.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAccessToken(null)
    }
    return Promise.reject(error)
  },
)
