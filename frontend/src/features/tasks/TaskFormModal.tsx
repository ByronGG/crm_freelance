import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextField, fieldInputClass } from '../../components/ui/TextField'
import { listContacts } from '../contacts/api'
import { listDeals } from '../deals/api'
import { listProjects } from '../projects/api'
import { createTask, updateTask } from './api'
import type { Task, TaskForm, TaskStatus } from './types'

const EMPTY: TaskForm = {
  title: '',
  dueDate: '',
  status: 'PENDING',
  contactId: '',
  dealId: '',
  projectId: '',
}

function fromTask(t: Task): TaskForm {
  return {
    title: t.title,
    dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
    status: t.status,
    contactId: t.contactId ?? '',
    dealId: t.dealId ?? '',
    projectId: t.projectId ?? '',
  }
}

interface Props {
  open: boolean
  onClose: () => void
  task: Task | null
}

export function TaskFormModal({ open, onClose, task }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<TaskForm>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const contacts = useQuery({
    queryKey: ['contacts', ''],
    queryFn: () => listContacts(),
    enabled: open,
  })
  const deals = useQuery({
    queryKey: ['deals', 'list'],
    queryFn: listDeals,
    enabled: open,
  })
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      setForm(task ? fromTask(task) : EMPTY)
      setError(null)
    }
  }, [open, task])

  const save = useMutation({
    mutationFn: (f: TaskForm) =>
      task ? updateTask(task.id, f) : createTask(f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
    onError: (err) => {
      const code = (err as AxiosError)?.response?.status
      setError(
        code === 400
          ? 'Revisa los datos: hay algún campo con formato inválido.'
          : 'No se pudo guardar la tarea.',
      )
    },
  })

  function setField<K extends keyof TaskForm>(k: K, v: TaskForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    save.mutate(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Editar tarea' : 'Nueva tarea'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Título"
          required
          autoFocus
          placeholder="Llamar al cliente"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Vencimiento"
            type="date"
            value={form.dueDate}
            onChange={(e) => setField('dueDate', e.target.value)}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Estado</span>
            <select
              className={fieldInputClass}
              value={form.status}
              onChange={(e) => setField('status', e.target.value as TaskStatus)}
            >
              <option value="PENDING">Pendiente</option>
              <option value="DONE">Hecha</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Contacto</span>
            <select
              className={fieldInputClass}
              value={form.contactId}
              onChange={(e) => setField('contactId', e.target.value)}
            >
              <option value="">Sin contacto</option>
              {contacts.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {[c.firstName, c.lastName].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Oportunidad</span>
            <select
              className={fieldInputClass}
              value={form.dealId}
              onChange={(e) => setField('dealId', e.target.value)}
            >
              <option value="">Sin oportunidad</option>
              {deals.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Proyecto</span>
          <select
            className={fieldInputClass}
            value={form.projectId}
            onChange={(e) => setField('projectId', e.target.value)}
          >
            <option value="">Sin proyecto</option>
            {projects.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
