import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { LayoutDashboard } from 'lucide-react'

import { useAuth } from './AuthContext'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Si ya hay sesión, fuera del login.
  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      const status = (err as AxiosError)?.response?.status
      setError(
        status === 401
          ? 'Email o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-app px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white">
            <LayoutDashboard size={18} />
          </span>
          <span className="text-lg font-medium text-fg">Trato · CRM</span>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <h1 className="text-lg font-medium text-fg">Inicia sesión</h1>
          <p className="mt-1 text-sm text-muted">
            Accede a tu cuenta para gestionar tu negocio.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Email</span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="h-10 w-full rounded-lg border border-line bg-app px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Contraseña</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 w-full rounded-lg border border-line bg-app px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-10 w-full rounded-lg bg-brand-500 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-fg hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
