import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Pencil, User, X } from 'lucide-react'

import { Badge } from '../../components/ui/Badge'
import { formatMoney, formatDateTime } from '../../lib/format'
import { fullName } from '../../lib/names'
import { ActivityTimeline } from '../activities/ActivityTimeline'
import { DEAL_STAGE_CLASS, DEAL_STAGE_LABEL } from './constants'
import { getDeal } from './api'
import type { Deal } from './types'

interface Props {
  deal: Deal | null
  onClose: () => void
  onEdit: (deal: Deal) => void
}

/** Panel lateral con el detalle de una oportunidad: historial y actividad. */
export function DealDetailDrawer({ deal, onClose, onEdit }: Props) {
  const open = deal !== null

  const detail = useQuery({
    queryKey: ['deal', deal?.id],
    queryFn: () => getDeal(deal!.id),
    enabled: open,
  })

  if (!open || !deal) return null

  const history = detail.data?.stageHistory ?? []
  const contact = detail.data?.contact ?? deal.contact

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar detalle"
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={onClose}
      />

      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface">
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <div className="mb-1.5">
              <Badge
                label={DEAL_STAGE_LABEL[deal.stage]}
                className={DEAL_STAGE_CLASS[deal.stage]}
              />
            </div>
            <h2 className="text-lg font-medium text-fg">{deal.title}</h2>
            <p className="mt-0.5 text-sm text-brand-fg">
              {formatMoney(deal.value)}
            </p>
            {contact && (
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                <User size={14} className="text-subtle" />
                {fullName(contact.firstName, contact.lastName)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(deal)}
              aria-label="Editar oportunidad"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {deal.stage === 'LOST' && deal.lostReason && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-subtle">
                Motivo de pérdida
              </h3>
              <p className="mt-1.5 text-sm text-muted">{deal.lostReason}</p>
            </div>
          )}

          <div className="rounded-xl border border-line bg-surface">
            <div className="border-b border-line px-4 py-2.5">
              <h3 className="text-sm font-medium text-fg">
                Historial de etapas
              </h3>
            </div>
            <div className="p-4">
              {detail.isLoading && (
                <p className="text-sm text-muted">Cargando…</p>
              )}
              {!detail.isLoading && history.length === 0 && (
                <p className="text-sm text-muted">Sin cambios registrados.</p>
              )}
              {history.length > 0 && (
                <ol className="space-y-2.5">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        {h.fromStage ? (
                          <>
                            <span>{DEAL_STAGE_LABEL[h.fromStage]}</span>
                            <ArrowRight size={13} className="text-subtle" />
                          </>
                        ) : (
                          <span className="text-subtle">Creada</span>
                        )}
                        <span className="font-medium text-fg">
                          {DEAL_STAGE_LABEL[h.toStage]}
                        </span>
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-subtle">
                        {formatDateTime(h.changedAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <ActivityTimeline dealId={deal.id} />
        </div>
      </div>
    </div>
  )
}
