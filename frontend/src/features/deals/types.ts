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

/** Campos editables del formulario de oportunidad. */
export interface DealInput {
  title: string
  value: string
  contactId: string
  expectedClose: string
}
