import type { ProposalStatus } from './types'

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
]

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
}

export const PROPOSAL_STATUS_CLASS: Record<ProposalStatus, string> = {
  DRAFT: 'bg-app text-muted',
  SENT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  ACCEPTED: 'bg-brand-soft text-brand-fg',
  REJECTED: 'bg-red-500/10 text-red-600 dark:text-red-400',
}
