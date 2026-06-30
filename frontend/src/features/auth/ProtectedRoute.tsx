import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Bloquea las rutas privadas: redirige al login si no hay sesión. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Cargando…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
