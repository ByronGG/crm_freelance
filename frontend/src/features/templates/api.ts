import { api } from '../../lib/api'
import type { ProposalTemplate, TemplateInput } from './types'

export async function listTemplates(): Promise<ProposalTemplate[]> {
  const { data } = await api.get<ProposalTemplate[]>('/proposal-templates')
  return data
}

export async function createTemplate(
  input: TemplateInput,
): Promise<ProposalTemplate> {
  const { data } = await api.post<ProposalTemplate>('/proposal-templates', {
    name: input.name.trim(),
    currency: input.currency,
    notes: input.notes.trim() || undefined,
    items: input.items
      .filter((i) => i.description.trim())
      .map((i) => ({
        description: i.description.trim(),
        quantity: i.quantity.trim() ? Number(i.quantity) : 1,
        unitPrice: i.unitPrice.trim() ? Number(i.unitPrice) : 0,
      })),
  })
  return data
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/proposal-templates/${id}`)
}
