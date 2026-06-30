import { api } from '../../lib/api'
import type {
  ItemForm,
  Proposal,
  ProposalDetail,
  ProposalForm,
  ProposalStatus,
} from './types'

function itemsPayload(items: ItemForm[]) {
  return items
    .filter((i) => i.description.trim())
    .map((i) => ({
      description: i.description.trim(),
      quantity: i.quantity.trim() ? Number(i.quantity) : 1,
      unitPrice: i.unitPrice.trim() ? Number(i.unitPrice) : 0,
    }))
}

function scalarsPayload(form: ProposalForm) {
  return {
    title: form.title.trim(),
    currency: form.currency.trim().toUpperCase() || 'USD',
    notes: form.notes.trim() || null,
    contactId: form.contactId || null,
    dealId: form.dealId || null,
  }
}

interface ListParams {
  status?: ProposalStatus
  search?: string
}

export async function listProposals(params: ListParams = {}): Promise<Proposal[]> {
  const query: Record<string, string> = {}
  if (params.status) query.status = params.status
  if (params.search) query.search = params.search
  const { data } = await api.get<Proposal[]>('/proposals', {
    params: Object.keys(query).length ? query : undefined,
  })
  return data
}

export async function getProposal(id: string): Promise<ProposalDetail> {
  const { data } = await api.get<ProposalDetail>(`/proposals/${id}`)
  return data
}

export async function createProposal(form: ProposalForm): Promise<Proposal> {
  const { data } = await api.post<Proposal>('/proposals', {
    ...scalarsPayload(form),
    items: itemsPayload(form.items),
  })
  return data
}

/** Edición: actualiza datos y reemplaza los ítems (recalcula el total). */
export async function updateProposal(
  id: string,
  form: ProposalForm,
): Promise<void> {
  await api.patch(`/proposals/${id}`, scalarsPayload(form))
  await api.put(`/proposals/${id}/items`, { items: itemsPayload(form.items) })
}

export async function changeStatus(
  id: string,
  status: ProposalStatus,
): Promise<Proposal> {
  const { data } = await api.patch<Proposal>(`/proposals/${id}/status`, {
    status,
  })
  return data
}

export async function deleteProposal(id: string): Promise<void> {
  await api.delete(`/proposals/${id}`)
}
