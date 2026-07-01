export interface CompanyProfile {
  id: string
  businessName: string
  taxId?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  logoUrl?: string | null
  createdAt: string
  updatedAt: string
}

/** Campos del formulario de perfil de empresa. */
export interface CompanyProfileForm {
  businessName: string
  taxId: string
  email: string
  phone: string
  address: string
  logoUrl: string
}
