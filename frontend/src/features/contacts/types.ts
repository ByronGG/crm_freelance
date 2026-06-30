export interface Company {
  id: string
  name: string
  website?: string | null
  industry?: string | null
}

export interface Contact {
  id: string
  firstName: string
  lastName?: string | null
  email?: string | null
  phone?: string | null
  position?: string | null
  notes?: string | null
  companyId?: string | null
  company?: Company | null
  createdAt: string
  updatedAt: string
}

/** Campos editables del formulario de contacto. */
export interface ContactInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  notes: string
  companyId: string
}
