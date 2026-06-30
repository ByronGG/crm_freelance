export type Role = 'ADMIN' | 'MEMBER'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}
