import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { fieldInputClass } from '../../components/ui/TextField'
import { formatDateTime } from '../../lib/format'
import { createActivity, deleteActivity, listActivities } from './api'
import type { ActivityType } from './types'

const TYPES: ActivityType[] = ['NOTE', 'CALL', 'EMAIL', 'MEETING']

const TYPE_LABEL: Record<ActivityType, string> = {
  NOTE: 'Nota',
  CALL: 'Llamada',
  EMAIL: 'Correo',
  MEETING: 'Reunión',
}

const TYPE_ICON: Record<ActivityType, LucideIcon> = {
  NOTE: StickyNote,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
}

const TYPE_CLASS: Record<ActivityType, string> = {
  NOTE: 'bg-app text-muted',
  CALL: 'bg-brand-soft text-brand-fg',
  EMAIL: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  MEETING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

interface Props {
  contactId?: string
  dealId?: string
}

/**
 * Línea de tiempo cronológica de un contacto o una oportunidad, con composer
 * para registrar. Se pasa contactId o dealId según dónde se embeba.
 */
export function ActivityTimeline({ contactId, dealId }: Props) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<ActivityType>('NOTE')
  const [content, setContent] = useState('')

  const filter = { contactId, dealId }
  const key = ['activities', contactId ?? '', dealId ?? '']

  const { data, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: () => listActivities(filter),
  })

  const add = useMutation({
    mutationFn: () => createActivity({ type, content, contactId, dealId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key })
      setContent('')
      setType('NOTE')
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    add.mutate()
  }

  const activities = data ?? []

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-medium text-fg">Actividad</h2>
        <p className="mt-0.5 text-xs text-muted">
          Notas, llamadas, correos y reuniones registradas.
        </p>
      </div>

      <form onSubmit={onSubmit} className="border-b border-line p-4">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const Icon = TYPE_ICON[t]
            const active = t === type
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-brand-500 bg-brand-soft text-brand-fg'
                    : 'border-line text-muted hover:bg-app hover:text-fg'
                }`}
              >
                <Icon size={13} /> {TYPE_LABEL[t]}
              </button>
            )
          })}
        </div>
        <textarea
          className={`${fieldInputClass} mt-3 h-auto resize-y py-2`}
          rows={2}
          placeholder="Escribe una nota o registra una interacción…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={!content.trim() || add.isPending}
          >
            {add.isPending ? 'Guardando…' : 'Registrar'}
          </Button>
        </div>
      </form>

      <div className="p-4">
        {isLoading && <p className="text-sm text-muted">Cargando actividad…</p>}
        {isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            No se pudo cargar la actividad.
          </p>
        )}
        {!isLoading && !isError && activities.length === 0 && (
          <div className="grid place-items-center py-8 text-center">
            <MessageSquare size={22} className="text-subtle" />
            <p className="mt-2 text-sm text-muted">
              Aún no hay actividad registrada.
            </p>
          </div>
        )}

        {activities.length > 0 && (
          <ol className="space-y-1">
            {activities.map((a, i) => {
              const Icon = TYPE_ICON[a.type]
              const last = i === activities.length - 1
              return (
                <li key={a.id} className="group flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${TYPE_CLASS[a.type]}`}
                    >
                      <Icon size={15} />
                    </span>
                    {!last && <span className="w-px flex-1 bg-line" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-fg">
                        {TYPE_LABEL[a.type]}
                      </span>
                      <span className="text-xs text-subtle">
                        {formatDateTime(a.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove.mutate(a.id)}
                        aria-label="Eliminar actividad"
                        className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-muted opacity-0 transition-colors hover:bg-app hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">
                      {a.content}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
