import { api } from '../../lib/api'
import type { Notification } from './types'

export async function listNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('/notifications')
  return data
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>(
    '/notifications/unread-count',
  )
  return data.count
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all')
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}
