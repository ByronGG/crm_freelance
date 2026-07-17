import { api } from '../../lib/api'
import type { Task, TaskForm, TaskStatus } from './types'

function toPayload(form: TaskForm) {
  return {
    title: form.title.trim(),
    status: form.status,
    dueDate: form.dueDate || null,
    contactId: form.contactId || null,
    dealId: form.dealId || null,
    projectId: form.projectId || null,
  }
}

export async function listTasks(status?: TaskStatus): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks', {
    params: status ? { status } : undefined,
  })
  return data
}

export async function createTask(form: TaskForm): Promise<Task> {
  const { data } = await api.post<Task>('/tasks', toPayload(form))
  return data
}

export async function updateTask(id: string, form: TaskForm): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, toPayload(form))
  return data
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, { status })
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`)
}
