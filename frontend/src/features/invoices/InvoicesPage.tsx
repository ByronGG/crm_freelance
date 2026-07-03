import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Plus, Receipt, Search, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { fieldInputClass } from '../../components/ui/TextField'
import { formatAmount } from '../../lib/format'
import { useDebounce } from '../../lib/useDebounce'
import { useFocusHighlight } from '../../lib/useFocusHighlight'
import { listProjects } from '../projects/api'
import { InvoiceFormModal } from './InvoiceFormModal'
import {
  changeStatus,
  deleteInvoice,
  downloadInvoicePdf,
  listInvoices,
} from './api'
import type { Invoice, InvoiceStatus } from './types'

const STATUSES: InvoiceStatus[] = ['DRAFT', 'ISSUED', 'PAID', 'OVERDUE']

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitida',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
}

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-app text-muted',
  ISSUED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PAID: 'bg-brand-soft text-brand-fg',
  OVERDUE: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

export function InvoicesPage() {
  const queryClient = useQueryClient()
  const focusId = useFocusHighlight()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState<Invoice | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoices', { status: statusFilter, search: debounced }],
    queryFn: () =>
      listInvoices({
        status: statusFilter || undefined,
        search: debounced || undefined,
      }),
  })

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(),
  })
  const projectName = useMemo(() => {
    const map = new Map<string, string>()
    projects.data?.forEach((p) => map.set(p.id, p.name))
    return map
  }, [projects.data])

  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: InvoiceStatus }) =>
      changeStatus(id, value),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setDeleting(null)
    },
  })

  const pdf = useMutation({
    mutationFn: (inv: Invoice) => downloadInvoicePdf(inv.id, inv.number),
  })

  const invoices = data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Facturas</h1>
          <p className="mt-1 text-sm text-muted">
            Facturación y cobro de tus proyectos.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus size={16} /> Nueva factura
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            className={`${fieldInputClass} pl-9`}
            placeholder="Buscar por número…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={`${fieldInputClass} w-40`}
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as InvoiceStatus | '')
          }
        >
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-muted">Cargando…</p>
        )}
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
            No se pudieron cargar las facturas.
          </p>
        )}

        {!isLoading && !isError && invoices.length === 0 && (
          <div className="grid place-items-center px-4 py-14 text-center">
            <Receipt size={26} className="text-subtle" />
            <p className="mt-3 text-sm font-medium text-fg">
              {debounced || statusFilter
                ? 'Sin resultados'
                : 'Aún no tienes facturas'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Genera una factura a partir de un proyecto.
            </p>
          </div>
        )}

        {invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-subtle">
                  <th className="px-4 py-2.5 font-medium">Número</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Vence</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const focused = inv.id === focusId
                  return (
                  <tr
                    key={inv.id}
                    ref={(el) => {
                      if (focused && el) el.scrollIntoView({ block: 'center' })
                    }}
                    className={[
                      'border-b border-line last:border-0 transition-colors',
                      focused ? 'bg-brand-soft/50' : 'hover:bg-app/60',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(inv)
                          setFormOpen(true)
                        }}
                        className="text-left"
                      >
                        <p className="font-medium text-fg">{inv.number}</p>
                        <p className="text-xs text-subtle">
                          {projectName.get(inv.projectId) ?? '—'}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={inv.status}
                        onChange={(e) =>
                          status.mutate({
                            id: inv.id,
                            value: e.target.value as InvoiceStatus,
                          })
                        }
                        className={`cursor-pointer rounded-lg px-2 py-1 text-xs font-medium outline-none ${STATUS_CLASS[inv.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {inv.dueDate ? inv.dueDate.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-fg">
                      {formatAmount(inv.total, inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => pdf.mutate(inv)}
                          disabled={pdf.isPending}
                          aria-label={`Descargar PDF de ${inv.number}`}
                          title="Descargar PDF"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg disabled:opacity-50"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(inv)}
                          aria-label="Eliminar"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        invoice={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar factura"
        message={`¿Seguro que quieres eliminar la factura ${
          deleting?.number ?? ''
        }? Esta acción no se puede deshacer.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
