import type { DealStage } from './types'

// Orden de las etapas del pipeline (izquierda → derecha en el Kanban).
export const DEAL_STAGES: DealStage[] = [
  'NEW',
  'CONTACTED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
]

export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  PROPOSAL: 'Propuesta',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
}

// Color del punto en las columnas del tablero.
export const DEAL_STAGE_DOT: Record<DealStage, string> = {
  NEW: '#85B7EB',
  CONTACTED: '#378ADD',
  PROPOSAL: '#EF9F27',
  NEGOTIATION: '#7F77DD',
  WON: '#0EA372',
  LOST: '#E24B4A',
}

// Clases de color para badges de solo lectura (vista 360°, detalle).
export const DEAL_STAGE_CLASS: Record<DealStage, string> = {
  NEW: 'bg-app text-muted',
  CONTACTED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PROPOSAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  NEGOTIATION: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  WON: 'bg-brand-soft text-brand-fg',
  LOST: 'bg-red-500/10 text-red-600 dark:text-red-400',
}
