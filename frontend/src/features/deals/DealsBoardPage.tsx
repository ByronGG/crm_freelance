import { useRef, useState, type DragEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { formatMoney } from '../../lib/format'
import { DealFormModal } from './DealFormModal'
import { getBoard, updateStage } from './api'
import type { BoardColumn, Deal, DealStage } from './types'

interface StageMeta {
  key: DealStage
  label: string
  dot: string
}

const STAGES: StageMeta[] = [
  { key: 'NEW', label: 'Nuevo', dot: '#85B7EB' },
  { key: 'CONTACTED', label: 'Contactado', dot: '#378ADD' },
  { key: 'PROPOSAL', label: 'Propuesta', dot: '#EF9F27' },
  { key: 'NEGOTIATION', label: 'Negociación', dot: '#7F77DD' },
  { key: 'WON', label: 'Ganado', dot: '#0EA372' },
  { key: 'LOST', label: 'Perdido', dot: '#E24B4A' },
]

function contactName(d: Deal): string | null {
  if (!d.contact) return null
  return [d.contact.firstName, d.contact.lastName].filter(Boolean).join(' ')
}

/** Mueve una oportunidad de columna y recalcula conteos/totales (optimista). */
function moveDeal(
  cols: BoardColumn[],
  id: string,
  toStage: DealStage,
): BoardColumn[] {
  let moved: Deal | undefined
  const removed = cols.map((col) => {
    const found = col.deals.find((d) => d.id === id)
    if (found) moved = { ...found, stage: toStage }
    return { ...col, deals: col.deals.filter((d) => d.id !== id) }
  })
  if (!moved) return cols
  return removed.map((col) => {
    const deals =
      col.stage === toStage ? [moved!, ...col.deals] : col.deals
    return {
      ...col,
      deals,
      count: deals.length,
      totalValue: deals.reduce((s, d) => s + Number(d.value), 0),
    }
  })
}

export function DealsBoardPage() {
  const queryClient = useQueryClient()
  const dragged = useRef<{ id: string; stage: DealStage } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<DealStage | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Deal | null>(null)
  const [lostTarget, setLostTarget] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deals', 'board'],
    queryFn: getBoard,
  })

  const changeStage = useMutation({
    mutationFn: ({
      id,
      stage,
      reason,
    }: {
      id: string
      stage: DealStage
      reason?: string
    }) => updateStage(id, stage, reason),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['deals', 'board'] })
      const prev = queryClient.getQueryData<BoardColumn[]>(['deals', 'board'])
      if (prev) {
        queryClient.setQueryData(['deals', 'board'], moveDeal(prev, id, stage))
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['deals', 'board'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', 'board'] })
    },
  })

  function onDragStart(deal: Deal) {
    dragged.current = { id: deal.id, stage: deal.stage }
    setDraggingId(deal.id)
  }

  function onDragEnd() {
    dragged.current = null
    setDraggingId(null)
    setOverStage(null)
  }

  function onDrop(e: DragEvent, stage: DealStage) {
    e.preventDefault()
    setOverStage(null)
    const item = dragged.current
    if (!item || item.stage === stage) return
    if (stage === 'LOST') {
      setLostReason('')
      setLostTarget(item.id)
    } else {
      changeStage.mutate({ id: item.id, stage })
    }
  }

  function confirmLost() {
    if (lostTarget) {
      changeStage.mutate({
        id: lostTarget,
        stage: 'LOST',
        reason: lostReason.trim() || undefined,
      })
    }
    setLostTarget(null)
  }

  const byStage = (stage: DealStage): BoardColumn | undefined =>
    data?.find((c) => c.stage === stage)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">
            Arrastra las tarjetas para mover cada oportunidad de etapa.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus size={16} /> Nueva oportunidad
        </Button>
      </div>

      {isLoading && (
        <p className="mt-6 text-sm text-muted">Cargando pipeline…</p>
      )}
      {isError && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">
          No se pudo cargar el pipeline.
        </p>
      )}

      {data && (
        <div className="mt-5 flex gap-2.5 overflow-x-auto pb-2">
          {STAGES.map((meta) => {
            const col = byStage(meta.key)
            const deals = col?.deals ?? []
            const isOver = overStage === meta.key
            return (
              <div
                key={meta.key}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverStage(meta.key)
                }}
                onDragLeave={() => setOverStage((s) => (s === meta.key ? null : s))}
                onDrop={(e) => onDrop(e, meta.key)}
                className={[
                  'flex min-w-[150px] flex-1 basis-0 flex-col rounded-xl border bg-app/40 p-2.5 transition-colors',
                  isOver
                    ? 'border-brand-500 bg-brand-soft/40'
                    : 'border-line',
                ].join(' ')}
              >
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: meta.dot }}
                    />
                    <span className="text-sm font-medium text-fg">
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-surface px-1.5 text-xs text-muted">
                      {col?.count ?? 0}
                    </span>
                  </div>
                  <span className="text-xs text-subtle">
                    {formatMoney(col?.totalValue ?? 0)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {deals.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      draggable
                      onDragStart={() => onDragStart(deal)}
                      onDragEnd={onDragEnd}
                      onClick={() => {
                        setEditing(deal)
                        setFormOpen(true)
                      }}
                      className={[
                        'cursor-grab rounded-lg border border-line bg-surface p-3 text-left transition-opacity active:cursor-grabbing',
                        draggingId === deal.id ? 'opacity-40' : '',
                      ].join(' ')}
                    >
                      <p className="text-sm font-medium text-fg">
                        {deal.title}
                      </p>
                      <p className="mt-1 text-sm text-brand-fg">
                        {formatMoney(deal.value)}
                      </p>
                      {contactName(deal) && (
                        <p className="mt-1.5 truncate text-xs text-subtle">
                          {contactName(deal)}
                        </p>
                      )}
                      {deal.stage === 'LOST' && deal.lostReason && (
                        <p className="mt-1.5 truncate text-xs text-red-600 dark:text-red-400">
                          {deal.lostReason}
                        </p>
                      )}
                    </button>
                  ))}
                  {deals.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-subtle">
                      Suelta aquí
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DealFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        deal={editing}
      />

      <Modal
        open={lostTarget !== null}
        onClose={() => setLostTarget(null)}
        title="Marcar como perdida"
      >
        <p className="text-sm text-muted">
          Puedes anotar el motivo de la pérdida (opcional).
        </p>
        <textarea
          autoFocus
          rows={3}
          value={lostReason}
          onChange={(e) => setLostReason(e.target.value)}
          placeholder="Presupuesto, competencia, sin respuesta…"
          className="mt-3 w-full resize-y rounded-lg border border-line bg-app px-3 py-2 text-sm text-fg outline-none placeholder:text-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setLostTarget(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmLost}>
            Marcar como perdida
          </Button>
        </div>
      </Modal>
    </div>
  )
}
