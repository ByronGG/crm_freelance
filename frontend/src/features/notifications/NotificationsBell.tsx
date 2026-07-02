import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRightLeft,
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  FileWarning,
  Trash2,
  type LucideIcon,
} from 'lucide-react'

import { timeAgo } from '../../lib/format'
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
} from './api'
import type { Notification, NotificationType } from './types'

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  REMINDER: Bell,
  DUE_DATE: CalendarClock,
  STAGE_CHANGE: ArrowRightLeft,
  INVOICE_OVERDUE: FileWarning,
}

const TYPE_CLASS: Record<NotificationType, string> = {
  REMINDER: 'bg-app text-muted',
  DUE_DATE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  STAGE_CHANGE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  INVOICE_OVERDUE: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

export function NotificationsBell() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
  })

  const list = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: listNotifications,
    enabled: open,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const readOne = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: invalidate,
  })
  const readAll = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: invalidate,
  })

  function onItemClick(n: Notification) {
    if (!n.read) readOne.mutate(n.id)
    if (n.link) {
      setOpen(false)
      navigate(n.link)
    }
  }

  const count = unread.data ?? 0
  const items = list.data ?? []

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificaciones"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-app hover:text-fg"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop para cerrar al hacer clic fuera. */}
          <button
            type="button"
            aria-label="Cerrar notificaciones"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-sm font-medium text-fg">Notificaciones</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => readAll.mutate()}
                  disabled={readAll.isPending}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-fg hover:underline disabled:opacity-60"
                >
                  <CheckCheck size={13} /> Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {list.isLoading && (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  Cargando…
                </p>
              )}

              {!list.isLoading && items.length === 0 && (
                <div className="grid place-items-center px-4 py-10 text-center">
                  <Bell size={22} className="text-subtle" />
                  <p className="mt-2 text-sm text-muted">Sin notificaciones.</p>
                </div>
              )}

              {items.map((n) => {
                const Icon = TYPE_ICON[n.type]
                return (
                  <div
                    key={n.id}
                    className={`group flex gap-3 border-b border-line px-4 py-3 last:border-0 ${
                      n.read ? '' : 'bg-brand-soft/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${TYPE_CLASS[n.type]}`}
                    >
                      <Icon size={15} />
                    </span>
                    <button
                      type="button"
                      onClick={() => onItemClick(n)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm text-fg">{n.message}</p>
                      <p className="mt-0.5 text-xs text-subtle">
                        {timeAgo(n.createdAt)}
                      </p>
                    </button>
                    <div className="flex flex-col items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => readOne.mutate(n.id)}
                          aria-label="Marcar como leída"
                          className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-app hover:text-fg"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove.mutate(n.id)}
                        aria-label="Eliminar notificación"
                        className="grid h-6 w-6 place-items-center rounded text-muted hover:bg-app hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
