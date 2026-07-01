export type TaskStatus = 'PENDING' | 'DONE'

export interface Task {
  id: string
  title: string
  dueDate?: string | null
  status: TaskStatus
  contactId?: string | null
  dealId?: string | null
  createdAt: string
}

/** Campos del formulario de tarea. */
export interface TaskForm {
  title: string
  dueDate: string
  status: TaskStatus
  contactId: string
  dealId: string
}
