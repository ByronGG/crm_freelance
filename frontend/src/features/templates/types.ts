export interface TemplateItem {
  id: string
  description: string
  quantity: string
  unitPrice: string
}

export interface ProposalTemplate {
  id: string
  name: string
  currency: string
  notes?: string | null
  items: TemplateItem[]
}

/** Datos para crear una plantilla (ítems como texto, igual que el formulario). */
export interface TemplateInput {
  name: string
  currency: string
  notes: string
  items: { description: string; quantity: string; unitPrice: string }[]
}
