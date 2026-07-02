import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Briefcase,
  FileText,
  Search,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { fieldInputClass } from '../ui/TextField'
import { useDebounce } from '../../lib/useDebounce'
import { fullName } from '../../lib/names'
import { listContacts } from '../../features/contacts/api'
import { searchDeals } from '../../features/deals/api'
import { listProjects } from '../../features/projects/api'
import { listProposals } from '../../features/proposals/api'

const MAX_PER_GROUP = 5

interface ResultItem {
  id: string
  title: string
  subtitle?: string
  to: string
}

interface ResultGroup {
  key: string
  label: string
  icon: LucideIcon
  items: ResultItem[]
}

/**
 * Búsqueda global de la topbar: consulta en paralelo los listados de cada
 * módulo con ?search= y compone los resultados en el cliente (mismo criterio
 * que la vista 360°: sin endpoint agregado para no acoplar módulos).
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(term)

  const enabled = open && debounced.trim().length >= 2
  const q = debounced.trim()

  const contacts = useQuery({
    queryKey: ['search', 'contacts', q],
    queryFn: () => listContacts(q),
    enabled,
  })
  const deals = useQuery({
    queryKey: ['search', 'deals', q],
    queryFn: () => searchDeals(q),
    enabled,
  })
  const projects = useQuery({
    queryKey: ['search', 'projects', q],
    queryFn: () => listProjects({ search: q }),
    enabled,
  })
  const proposals = useQuery({
    queryKey: ['search', 'proposals', q],
    queryFn: () => listProposals({ search: q }),
    enabled,
  })

  // Atajo Ctrl/Cmd+K para enfocar la búsqueda desde cualquier pantalla.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const groups: ResultGroup[] = [
    {
      key: 'contacts',
      label: 'Contactos',
      icon: Users,
      items: (contacts.data ?? []).slice(0, MAX_PER_GROUP).map((c) => ({
        id: c.id,
        title: fullName(c.firstName, c.lastName),
        subtitle: c.company?.name ?? c.email ?? undefined,
        to: `/contacts/${c.id}`,
      })),
    },
    {
      key: 'deals',
      label: 'Oportunidades',
      icon: Target,
      items: (deals.data ?? []).slice(0, MAX_PER_GROUP).map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.contact
          ? fullName(d.contact.firstName, d.contact.lastName)
          : undefined,
        to: '/deals',
      })),
    },
    {
      key: 'projects',
      label: 'Proyectos',
      icon: Briefcase,
      items: (projects.data ?? []).slice(0, MAX_PER_GROUP).map((p) => ({
        id: p.id,
        title: p.name,
        to: '/projects',
      })),
    },
    {
      key: 'proposals',
      label: 'Propuestas',
      icon: FileText,
      items: (proposals.data ?? []).slice(0, MAX_PER_GROUP).map((p) => ({
        id: p.id,
        title: p.title,
        to: '/proposals',
      })),
    },
  ]

  const isLoading =
    contacts.isLoading || deals.isLoading || projects.isLoading || proposals.isLoading
  const hasResults = groups.some((g) => g.items.length > 0)

  function go(item: ResultItem) {
    setOpen(false)
    setTerm('')
    navigate(item.to)
  }

  return (
    <div className="relative max-w-md flex-1">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
      />
      <input
        ref={inputRef}
        className={`${fieldInputClass} h-9 pl-9 pr-12`}
        placeholder="Buscar en el CRM…"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-app px-1.5 py-0.5 text-[10px] text-subtle">
        Ctrl K
      </kbd>

      {open && q.length >= 2 && (
        <>
          <button
            type="button"
            aria-label="Cerrar búsqueda"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg">
            {isLoading && (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Buscando…
              </p>
            )}

            {!isLoading && !hasResults && (
              <p className="px-4 py-6 text-center text-sm text-muted">
                Sin resultados para «{q}».
              </p>
            )}

            {!isLoading &&
              groups
                .filter((g) => g.items.length > 0)
                .map((group) => (
                  <div key={group.key} className="py-1">
                    <p className="px-4 py-1 text-[11px] font-medium uppercase tracking-wide text-subtle">
                      {group.label}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-app"
                      >
                        <group.icon size={15} className="shrink-0 text-subtle" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-fg">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="block truncate text-xs text-subtle">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
          </div>
        </>
      )}
    </div>
  )
}
