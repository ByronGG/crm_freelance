export type ProposalStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'

export interface ProposalRelContact {
  id: string
  firstName: string
  lastName?: string | null
}

export interface ProposalRelDeal {
  id: string
  title: string
}

export interface Proposal {
  id: string
  title: string
  status: ProposalStatus
  currency: string
  total: string
  notes?: string | null
  sentAt?: string | null
  contactId?: string | null
  dealId?: string | null
  contact?: ProposalRelContact | null
  deal?: ProposalRelDeal | null
  createdAt: string
  updatedAt: string
}

export interface ProposalItem {
  id: string
  description: string
  quantity: string
  unitPrice: string
}

export interface ProposalDetail extends Proposal {
  items: ProposalItem[]
}

/** Fila de ítem en el formulario (valores como texto para los inputs). */
export interface ItemForm {
  description: string
  quantity: string
  unitPrice: string
}

/** Campos del formulario de propuesta. */
export interface ProposalForm {
  title: string
  currency: string
  notes: string
  contactId: string
  dealId: string
  items: ItemForm[]
}
