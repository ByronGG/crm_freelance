import { LogOut, Search } from 'lucide-react'

import { useAuth } from '../../features/auth/AuthContext'
import { NotificationsBell } from '../../features/notifications/NotificationsBell'
import { initialsFromName } from '../../lib/names'
import { ThemeToggle } from '../ThemeToggle'

export function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
      <div className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-line bg-app px-3 text-sm text-subtle">
        <Search size={16} />
        <span>Buscar…</span>
      </div>

      <div className="flex-1" />

      <ThemeToggle />

      <NotificationsBell />

      <div className="flex items-center gap-2.5 pl-1">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-xs font-medium text-white">
          {user ? initialsFromName(user.name) : '—'}
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium text-fg">{user?.name}</p>
          <p className="text-xs text-subtle">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
