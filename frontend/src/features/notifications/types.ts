export type NotificationType =
  | 'REMINDER'
  | 'DUE_DATE'
  | 'STAGE_CHANGE'
  | 'INVOICE_OVERDUE'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  link?: string | null
  read: boolean
  createdAt: string
}
