import { api } from '../../lib/api'
import type { MemberInput, TeamMember } from './types'

/** Miembros de la cuenta (ADMIN + MEMBER). */
export async function listTeam(): Promise<TeamMember[]> {
  const { data } = await api.get<TeamMember[]>('/users')
  return data
}

/** Da de alta un miembro (solo ADMIN). */
export async function createMember(input: MemberInput): Promise<TeamMember> {
  const { data } = await api.post<TeamMember>('/users', {
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
  })
  return data
}

/** Quita un miembro de la cuenta (solo ADMIN). */
export async function deleteMember(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}
