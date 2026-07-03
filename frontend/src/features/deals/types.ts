export type DealStage =
  | 'NEW'
  | 'CONTACTED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'

export interface DealContact {
  id: string
  firstName: string
  lastName?: string | null
}

export interface Deal {
  id: string
  title: string
  value: string
  stage: DealStage
  expectedClose?: string | null
  lostReason?: string | null
  contactId?: string | null
  contact?: DealContact | null
  createdAt: string
  updatedAt: string
}

export interface BoardColumn {
  stage: DealStage
  count: number
  totalValue: number
  deals: Deal[]
}

/** Entrada del historial de cambios de etapa. */
export interface DealStageHistoryEntry {
  id: string
  fromStage: DealStage | null
  toStage: DealStage
  changedAt: string
}

/** Detalle de la oportunidad: incluye el historial de etapas. */
export interface DealDetail extends Deal {
  stageHistory: DealStageHistoryEntry[]
}

/** Campos editables del formulario de oportunidad. */
export interface DealInput {
  title: string
  value: string
  contactId: string
  expectedClose: string
}
