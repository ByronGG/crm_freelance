import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { fieldInputClass } from '../../components/ui/TextField'
import { listContacts } from '../contacts/api'
import { listDeals } from '../deals/api'
import { TaskFormModal } from './TaskFormModal'
import { deleteTask, listTasks, setTaskStatus } from './api'
import type { Task, TaskStatus } from './types'

/** Fecha local de hoy como 'YYYY-MM-DD' (comparación sin desfase horario). */
function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function TasksPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: () => listTasks(statusFilter || undefined),
  })

  // Mapas para mostrar el nombre del contacto / oportunidad asociados.
  const contacts = useQuery({
    queryKey: ['contacts', ''],
    queryFn: () => listContacts(),
  })
  const deals = useQuery({ queryKey: ['deals', 'list'], queryFn: listDeals })
  const names = useMemo(() => {
    const c = new Map<string, string>()
    contacts.data?.forEach((x) =>
      c.set(x.id, [x.firstName, x.lastName].filter(Boolean).join(' ')),
    )
    const d = new Map<string, string>()
    deals.data?.forEach((x) => d.set(x.id, x.title))
    return { c, d }
  }, [contacts.data, deals.data])

  const toggle = useMutation({
    mutationFn: (t: Task) =>
      setTaskStatus(t.id, t.status === 'DONE' ? 'PENDING' : 'DONE'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setDeleting(null)
    },
  })

  const tasks = data ?? []
  const today = todayString()

  function relation(t: Task): string | null {
    if (t.contactId && names.c.get(t.contactId)) return names.c.get(t.contactId)!
    if (t.dealId && names.d.get(t.dealId)) return names.d.get(t.dealId)!
    return null
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Tareas</h1>
          <p className="mt-1 text-sm text-muted">
            Tus seguimientos y pendientes.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus size={16} /> Nueva tarea
        </Button>
      </div>

      <div className="mt-5">
        <select
          className={`${fieldInputClass} w-40`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
        >
          <option value="">Todas</option>
          <option value="PENDING">Pendientes</option>
          <option value="DONE">Hechas</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-muted">Cargando…</p>
        )}
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
            No se pudieron cargar las tareas.
          </p>
        )}

        {!isLoading && !isError && tasks.length === 0 && (
          <div className="grid place-items-center px-4 py-14 text-center">
            <ListTodo size={26} className="text-subtle" />
            <p className="mt-3 text-sm font-medium text-fg">
              {statusFilter ? 'Sin tareas en este filtro' : 'Sin tareas'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Crea una tarea para no perder seguimientos.
            </p>
          </div>
        )}

        {tasks.map((t) => {
          const done = t.status === 'DONE'
          const overdue =
            !done && !!t.dueDate && t.dueDate.slice(0, 10) < today
          const rel = relation(t)
          return (
            <div
              key={t.id}
              className="group flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-app/60"
            >
              <button
                type="button"
                onClick={() => toggle.mutate(t)}
                aria-label={done ? 'Marcar pendiente' : 'Marcar hecha'}
                className={[
                  'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                  done
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-line-strong hover:border-brand-500',
                ].join(' ')}
              >
                {done && <Check size={13} />}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={[
                    'truncate text-sm',
                    done ? 'text-muted line-through' : 'text-fg',
                  ].join(' ')}
                >
                  {t.title}
                </p>
                {(t.dueDate || rel) && (
                  <p className="truncate text-xs text-subtle">
                    {t.dueDate && (
                      <span
                        className={
                          overdue ? 'text-red-600 dark:text-red-400' : ''
                        }
                      >
                        {t.dueDate.slice(0, 10)}
                        {overdue ? ' · vencida' : ''}
                      </span>
                    )}
                    {t.dueDate && rel ? ' · ' : ''}
                    {rel}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(t)
                    setFormOpen(true)
                  }}
                  aria-label="Editar"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(t)}
                  aria-label="Eliminar"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar tarea"
        message={`¿Seguro que quieres eliminar "${
          deleting?.title ?? ''
        }"?`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
