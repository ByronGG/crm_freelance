import { api } from '../../lib/api'
import type { CompanyProfile, CompanyProfileForm } from './types'

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const { data } = await api.get<CompanyProfile | null>(
    '/settings/company-profile',
  )
  return data
}

export async function upsertCompanyProfile(
  form: CompanyProfileForm,
): Promise<CompanyProfile> {
  const clean = (v: string) => {
    const t = v.trim()
    return t.length > 0 ? t : null
  }
  const { data } = await api.put<CompanyProfile>('/settings/company-profile', {
    businessName: form.businessName.trim(),
    taxId: clean(form.taxId),
    email: clean(form.email),
    phone: clean(form.phone),
    address: clean(form.address),
    logoUrl: clean(form.logoUrl),
  })
  return data
}
