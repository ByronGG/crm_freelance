import { api } from '../../lib/api'
import type { Company, Contact, ContactInput } from './types'

/** Convierte el formulario en el payload del backend: vacíos → null. */
function toPayload(input: ContactInput) {
  const clean = (v: string) => {
    const t = v.trim()
    return t.length > 0 ? t : null
  }
  return {
    firstName: input.firstName.trim(),
    lastName: clean(input.lastName),
    email: clean(input.email),
    phone: clean(input.phone),
    position: clean(input.position),
    notes: clean(input.notes),
    companyId: input.companyId || null,
  }
}

export async function listContacts(search?: string): Promise<Contact[]> {
  const { data } = await api.get<Contact[]>('/contacts', {
    params: search ? { search } : undefined,
  })
  return data
}

/** Detalle de un contacto con su empresa asociada (vista 360°). */
export async function getContact(id: string): Promise<Contact> {
  const { data } = await api.get<Contact>(`/contacts/${id}`)
  return data
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const { data } = await api.post<Contact>('/contacts', toPayload(input))
  return data
}

export async function updateContact(
  id: string,
  input: ContactInput,
): Promise<Contact> {
  const { data } = await api.patch<Contact>(`/contacts/${id}`, toPayload(input))
  return data
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/contacts/${id}`)
}

export async function listCompanies(): Promise<Company[]> {
  const { data } = await api.get<Company[]>('/companies')
  return data
}

export async function createCompany(name: string): Promise<Company> {
  const { data } = await api.post<Company>('/companies', { name: name.trim() })
  return data
}
