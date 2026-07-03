import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { fieldInputClass } from '../../components/ui/TextField'
import { formatAmount } from '../../lib/format'
import { fullName } from '../../lib/names'
import { useDebounce } from '../../lib/useDebounce'
import { ProposalFormModal } from './ProposalFormModal'
import {
  PROPOSAL_STATUSES as STATUSES,
  PROPOSAL_STATUS_CLASS as STATUS_CLASS,
  PROPOSAL_STATUS_LABEL as STATUS_LABEL,
} from './constants'
import {
  changeStatus,
  deleteProposal,
  downloadProposalPdf,
  listProposals,
} from './api'
import type { Proposal, ProposalStatus } from './types'

function relName(p: Proposal): string {
  if (p.contact) return fullName(p.contact.firstName, p.contact.lastName)
  if (p.deal) return p.deal.title
  return '—'
}

export function ProposalsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Proposal | null>(null)
  const [deleting, setDeleting] = useState<Proposal | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['proposals', { status: statusFilter, search: debounced }],
    queryFn: () =>
      listProposals({
        status: statusFilter || undefined,
        search: debounced || undefined,
      }),
  })

  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: ProposalStatus }) =>
      changeStatus(id, value),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['proposals'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      setDeleting(null)
    },
  })

  const pdf = useMutation({
    mutationFn: (p: Proposal) => downloadProposalPdf(p.id, p.title),
  })

  const proposals = data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Propuestas</h1>
          <p className="mt-1 text-sm text-muted">
            Cotizaciones enviadas a tus contactos.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus size={16} /> Nueva propuesta
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
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={`${fieldInputClass} w-40`}
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProposalStatus | '')
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
            No se pudieron cargar las propuestas.
          </p>
        )}

        {!isLoading && !isError && proposals.length === 0 && (
          <div className="grid place-items-center px-4 py-14 text-center">
            <FileText size={26} className="text-subtle" />
            <p className="mt-3 text-sm font-medium text-fg">
              {debounced || statusFilter
                ? 'Sin resultados'
                : 'Aún no tienes propuestas'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Crea tu primera propuesta con sus ítems.
            </p>
          </div>
        )}

        {proposals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-subtle">
                  <th className="px-4 py-2.5 font-medium">Propuesta</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-line last:border-0 hover:bg-app/60"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{p.title}</p>
                      <p className="text-xs text-subtle">{relName(p)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) =>
                          status.mutate({
                            id: p.id,
                            value: e.target.value as ProposalStatus,
                          })
                        }
                        className={`cursor-pointer rounded-lg px-2 py-1 text-xs font-medium outline-none ${STATUS_CLASS[p.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-fg">
                      {formatAmount(p.total, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => pdf.mutate(p)}
                          disabled={pdf.isPending}
                          aria-label={`Descargar PDF de ${p.title}`}
                          title="Descargar PDF"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg disabled:opacity-50"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(p)
                            setFormOpen(true)
                          }}
                          aria-label="Editar"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          aria-label="Eliminar"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProposalFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        proposal={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar propuesta"
        message={`¿Seguro que quieres eliminar "${
          deleting?.title ?? ''
        }"? Esta acción no se puede deshacer.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
