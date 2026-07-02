import type { ProjectStatus } from './types'

export const PROJECT_STATUSES: ProjectStatus[] = [
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
]

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'En pausa',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

export const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  ACTIVE: 'bg-brand-soft text-brand-fg',
  PAUSED: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  CANCELLED: 'bg-app text-muted',
}
