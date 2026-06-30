import { api } from '../../lib/api'
import type { BoardColumn, Deal, DealInput, DealStage } from './types'

/** Convierte el formulario en el payload del backend. */
function toPayload(input: DealInput) {
  return {
    title: input.title.trim(),
    value: input.value.trim() ? Number(input.value) : 0,
    contactId: input.contactId || null,
    expectedClose: input.expectedClose || null,
  }
}

export async function getBoard(): Promise<BoardColumn[]> {
  const { data } = await api.get<BoardColumn[]>('/deals/board')
  return data
}

/** Listado plano de oportunidades (para selectores en otros módulos). */
export async function listDeals(): Promise<Deal[]> {
  const { data } = await api.get<Deal[]>('/deals')
  return data
}

export async function createDeal(input: DealInput): Promise<Deal> {
  const { data } = await api.post<Deal>('/deals', toPayload(input))
  return data
}

export async function updateDeal(id: string, input: DealInput): Promise<Deal> {
  const { data } = await api.patch<Deal>(`/deals/${id}`, toPayload(input))
  return data
}

export async function updateStage(
  id: string,
  stage: DealStage,
  lostReason?: string,
): Promise<Deal> {
  const { data } = await api.patch<Deal>(`/deals/${id}/stage`, {
    stage,
    ...(lostReason ? { lostReason } : {}),
  })
  return data
}

export async function deleteDeal(id: string): Promise<void> {
  await api.delete(`/deals/${id}`)
}
