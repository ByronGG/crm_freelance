import type { Role } from '../auth/types'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  accountOwnerId?: string | null
  createdAt: string
}

/** Campos para dar de alta un miembro. */
export interface MemberInput {
  name: string
  email: string
  password: string
}
