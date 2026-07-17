import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Clock, Plus, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import {
  TextArea,
  TextField,
  fieldBase,
  fieldInputClass,
} from '../../components/ui/TextField'
import { formatDate } from '../../lib/format'
import { listContacts } from '../contacts/api'
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from './constants'
import {
  addMilestone,
  addTimeEntry,
  createProject,
  getProject,
  removeMilestone,
  removeTimeEntry,
  updateMilestone,
  updateProject,
} from './api'
import type {
  MilestoneForm,
  MilestoneStatus,
  Project,
  ProjectForm,
  ProjectStatus,
  TimeEntryForm,
} from './types'

const EMPTY_TIME: TimeEntryForm = { description: '', hours: '', date: '' }

/** Minutos → "Xh Ym" para mostrar el total de tiempo dedicado. */
function formatMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const MILESTONE_STATUSES: { value: MilestoneStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'DONE', label: 'Hecho' },
]

const EMPTY: ProjectForm = {
  name: '',
  description: '',
  status: 'ACTIVE',
  startDate: '',
  endDate: '',
  contactId: '',
}

const EMPTY_MILESTONE: MilestoneForm = {
  title: '',
  dueDate: '',
  status: 'PENDING',
}

function fromProject(p: Project): ProjectForm {
  return {
    name: p.name,
    description: p.description ?? '',
    status: p.status,
    startDate: p.startDate ? p.startDate.slice(0, 10) : '',
    endDate: p.endDate ? p.endDate.slice(0, 10) : '',
    contactId: p.contactId ?? '',
  }
}

interface Props {
  open: boolean
  onClose: () => void
  project: Project | null
}

export function ProjectFormModal({ open, onClose, project }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProjectForm>(EMPTY)
  const [milestone, setMilestone] = useState<MilestoneForm>(EMPTY_MILESTONE)
  const [time, setTime] = useState<TimeEntryForm>(EMPTY_TIME)
  const [error, setError] = useState<string | null>(null)

  const detail = useQuery({
    queryKey: ['projects', project?.id],
    queryFn: () => getProject(project!.id),
    enabled: open && !!project,
  })

  const contacts = useQuery({
    queryKey: ['contacts', ''],
    queryFn: () => listContacts(),
    enabled: open,
  })

  // Si el proyecto deriva de una oportunidad o propuesta, su cliente lo fija el
  // origen y no se puede cambiar aquí.
  const clientLocked = !!project && (!!project.dealId || !!project.proposalId)

  useEffect(() => {
    if (!open) return
    setError(null)
    setMilestone(EMPTY_MILESTONE)
    setTime(EMPTY_TIME)
    setForm(project ? fromProject(project) : EMPTY)
  }, [open, project])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  const refetchDetail = () =>
    queryClient.invalidateQueries({ queryKey: ['projects', project?.id] })

  const save = useMutation({
    mutationFn: (f: ProjectForm) =>
      project ? updateProject(project.id, f) : createProject(f),
    onSuccess: () => {
      invalidate()
      onClose()
    },
    onError: (err) => {
      const code = (err as AxiosError)?.response?.status
      setError(
        code === 400
          ? 'Revisa los datos: hay algún campo con formato inválido.'
          : 'No se pudo guardar el proyecto.',
      )
    },
  })

  const addM = useMutation({
    mutationFn: (f: MilestoneForm) => addMilestone(project!.id, f),
    onSuccess: () => {
      setMilestone(EMPTY_MILESTONE)
      refetchDetail()
    },
  })
  const updateM = useMutation({
    mutationFn: (v: { id: string; status: MilestoneStatus }) =>
      updateMilestone(project!.id, v.id, { status: v.status }),
    onSuccess: refetchDetail,
  })
  const removeM = useMutation({
    mutationFn: (id: string) => removeMilestone(project!.id, id),
    onSuccess: refetchDetail,
  })

  const addT = useMutation({
    mutationFn: (f: TimeEntryForm) => addTimeEntry(project!.id, f),
    onSuccess: () => {
      setTime(EMPTY_TIME)
      refetchDetail()
    },
  })
  const removeT = useMutation({
    mutationFn: (id: string) => removeTimeEntry(project!.id, id),
    onSuccess: refetchDetail,
  })

  function setField<K extends keyof ProjectForm>(k: K, v: ProjectForm[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.contactId) {
      setError('Elige el cliente del proyecto.')
      return
    }
    save.mutate(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={project ? 'Editar proyecto' : 'Nuevo proyecto'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {detail.data?.deal && (
          <p className="text-sm text-muted">
            Origen: oportunidad{' '}
            <span className="text-fg">{detail.data.deal.title}</span>
          </p>
        )}

        <div className="grid grid-cols-[1fr_150px] gap-3">
          <TextField
            label="Nombre"
            required
            autoFocus
            placeholder="Rediseño del sitio web"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Estado</span>
            <select
              className={fieldInputClass}
              value={form.status}
              onChange={(e) =>
                setField('status', e.target.value as ProjectStatus)
              }
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROJECT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">
            Cliente <span className="text-red-500">*</span>
          </span>
          <select
            required
            className={fieldInputClass}
            value={form.contactId}
            disabled={clientLocked}
            onChange={(e) => setField('contactId', e.target.value)}
          >
            <option value="" disabled>
              Selecciona un cliente
            </option>
            {contacts.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {[c.firstName, c.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
          {clientLocked && (
            <span className="mt-1 block text-xs text-subtle">
              El cliente lo define el origen del proyecto.
            </span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Inicio"
            type="date"
            value={form.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
          />
          <TextField
            label="Fin"
            type="date"
            value={form.endDate}
            onChange={(e) => setField('endDate', e.target.value)}
          />
        </div>

        <TextArea
          label="Descripción"
          rows={2}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>

      {project && detail.data && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-sm text-muted">Hitos</p>
          <div className="space-y-1.5">
            {detail.data.milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate font-medium text-fg">
                  {m.title}
                </span>
                {m.dueDate && (
                  <span className="shrink-0 text-xs text-subtle">
                    {m.dueDate.slice(0, 10)}
                  </span>
                )}
                <select
                  value={m.status}
                  onChange={(e) =>
                    updateM.mutate({
                      id: m.id,
                      status: e.target.value as MilestoneStatus,
                    })
                  }
                  className={`${fieldBase} h-8 shrink-0 py-0 text-xs`}
                >
                  {MILESTONE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeM.mutate(m.id)}
                  aria-label="Quitar hito"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {detail.data.milestones.length === 0 && (
              <p className="py-1 text-xs text-subtle">Sin hitos.</p>
            )}
          </div>

          <div className="mt-2.5 flex gap-2">
            <input
              className={`${fieldBase} min-w-0 flex-1`}
              placeholder="Nuevo hito"
              value={milestone.title}
              onChange={(e) =>
                setMilestone((p) => ({ ...p, title: e.target.value }))
              }
            />
            <input
              className={`${fieldBase} w-40 shrink-0`}
              type="date"
              value={milestone.dueDate}
              onChange={(e) =>
                setMilestone((p) => ({ ...p, dueDate: e.target.value }))
              }
            />
            <Button
              type="button"
              variant="primary"
              disabled={!milestone.title.trim() || addM.isPending}
              onClick={() => addM.mutate(milestone)}
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Time-tracking */}
          <div className="mt-5 flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Clock size={14} className="text-subtle" /> Tiempo dedicado
            </p>
            <span className="text-sm font-medium text-fg">
              {formatMinutes(detail.data.totalMinutes)}
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            {detail.data.timeEntries.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate text-fg">
                  {t.description}
                </span>
                <span className="shrink-0 text-xs text-subtle">
                  {formatDate(t.date)}
                </span>
                <span className="w-14 shrink-0 text-right text-xs font-medium text-fg">
                  {formatMinutes(t.minutes)}
                </span>
                <button
                  type="button"
                  onClick={() => removeT.mutate(t.id)}
                  aria-label="Quitar registro"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {detail.data.timeEntries.length === 0 && (
              <p className="py-1 text-xs text-subtle">Sin tiempo registrado.</p>
            )}
          </div>

          <div className="mt-2.5 flex gap-2">
            <input
              className={`${fieldBase} min-w-0 flex-1`}
              placeholder="¿En qué trabajaste?"
              value={time.description}
              onChange={(e) =>
                setTime((p) => ({ ...p, description: e.target.value }))
              }
            />
            <input
              className={`${fieldBase} w-20 shrink-0`}
              type="number"
              min="0"
              step="0.25"
              placeholder="Horas"
              value={time.hours}
              onChange={(e) =>
                setTime((p) => ({ ...p, hours: e.target.value }))
              }
            />
            <input
              className={`${fieldBase} w-40 shrink-0`}
              type="date"
              value={time.date}
              onChange={(e) => setTime((p) => ({ ...p, date: e.target.value }))}
            />
            <Button
              type="button"
              variant="primary"
              disabled={
                !time.description.trim() ||
                Number(time.hours) <= 0 ||
                addT.isPending
              }
              onClick={() => addT.mutate(time)}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
