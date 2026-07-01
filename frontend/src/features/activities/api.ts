import { api } from '../../lib/api'
import type { Activity, ActivityInput, ActivityType } from './types'

interface ListParams {
  contactId?: string
  dealId?: string
  type?: ActivityType
}

/** Lista actividades (más recientes primero). Filtrada por contacto = timeline. */
export async function listActivities(
  params: ListParams = {},
): Promise<Activity[]> {
  const query: Record<string, string> = {}
  if (params.contactId) query.contactId = params.contactId
  if (params.dealId) query.dealId = params.dealId
  if (params.type) query.type = params.type
  const { data } = await api.get<Activity[]>('/activities', {
    params: Object.keys(query).length ? query : undefined,
  })
  return data
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const { data } = await api.post<Activity>('/activities', {
    type: input.type,
    content: input.content.trim(),
    contactId: input.contactId || null,
    dealId: input.dealId || null,
  })
  return data
}

export async function deleteActivity(id: string): Promise<void> {
  await api.delete(`/activities/${id}`)
}
