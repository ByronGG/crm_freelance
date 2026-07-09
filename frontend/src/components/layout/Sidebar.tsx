import { NavLink } from 'react-router-dom'
import {
  Briefcase,
  FileText,
  Home,
  ListTodo,
  Receipt,
  Settings,
  Target,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

import { useAuth } from '../../features/auth/AuthContext'
import { TratoMark } from '../ui/TratoMark'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/contacts', label: 'Contactos', icon: Users },
  { to: '/deals', label: 'Pipeline', icon: Target },
  { to: '/proposals', label: 'Propuestas', icon: FileText },
  { to: '/projects', label: 'Proyectos', icon: Briefcase },
  { to: '/tasks', label: 'Tareas', icon: ListTodo },
  { to: '/invoices', label: 'Facturas', icon: Receipt },
  { to: '/team', label: 'Equipo', icon: UsersRound, adminOnly: true },
  { to: '/settings', label: 'Ajustes', icon: Settings },
]

export function Sidebar() {
  const { user } = useAuth()
  const items = NAV.filter((i) => !i.adminOnly || user?.role === 'ADMIN')

  return (
    <aside className="flex w-60 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <TratoMark size={32} className="text-brand-500" />
        <span className="text-[15px] font-medium text-fg">Trato</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-brand-soft font-medium text-brand-fg'
                  : 'text-muted hover:bg-app hover:text-fg',
              ].join(' ')
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
