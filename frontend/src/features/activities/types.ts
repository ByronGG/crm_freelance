export type ActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING'

export interface Activity {
  id: string
  type: ActivityType
  content: string
  contactId?: string | null
  dealId?: string | null
  createdAt: string
}

/** Campos del formulario para registrar una actividad. */
export interface ActivityInput {
  type: ActivityType
  content: string
  contactId?: string | null
  dealId?: string | null
}
