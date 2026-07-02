import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Briefcase, Plus, Search, Sparkles, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { fieldInputClass } from '../../components/ui/TextField'
import { useDebounce } from '../../lib/useDebounce'
import { listDeals } from '../deals/api'
import { ProjectFormModal } from './ProjectFormModal'
import {
  PROJECT_STATUSES as STATUSES,
  PROJECT_STATUS_CLASS as STATUS_CLASS,
  PROJECT_STATUS_LABEL as STATUS_LABEL,
} from './constants'
import {
  changeStatus,
  createFromDeal,
  deleteProject,
  listProjects,
} from './api'
import type { Project, ProjectStatus } from './types'

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [convertOpen, setConvertOpen] = useState(false)
  const [dealToConvert, setDealToConvert] = useState('')
  const [convertError, setConvertError] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', { status: statusFilter, search: debounced }],
    queryFn: () =>
      listProjects({
        status: statusFilter || undefined,
        search: debounced || undefined,
      }),
  })

  // Oportunidades ganadas que todavía no tienen proyecto.
  const allProjects = useQuery({ queryKey: ['projects'], queryFn: () => listProjects() })
  const deals = useQuery({ queryKey: ['deals', 'list'], queryFn: listDeals })
  const convertible = useMemo(() => {
    const linked = new Set(
      allProjects.data?.map((p) => p.dealId).filter(Boolean),
    )
    return (deals.data ?? []).filter(
      (d) => d.stage === 'WON' && !linked.has(d.id),
    )
  }, [deals.data, allProjects.data])

  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: ProjectStatus }) =>
      changeStatus(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setDeleting(null)
    },
  })

  const convert = useMutation({
    mutationFn: (dealId: string) => createFromDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setConvertOpen(false)
      setDealToConvert('')
    },
    onError: (err) => {
      const code = (err as AxiosError)?.response?.status
      setConvertError(
        code === 409
          ? 'Esa oportunidad ya tiene un proyecto.'
          : 'No se pudo convertir la oportunidad.',
      )
    },
  })

  const projects = data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Proyectos</h1>
          <p className="mt-1 text-sm text-muted">
            Proyectos contratados y su avance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setConvertError(null)
              setDealToConvert('')
              setConvertOpen(true)
            }}
          >
            <Sparkles size={16} /> Desde oportunidad
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus size={16} /> Nuevo proyecto
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            className={`${fieldInputClass} pl-9`}
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={`${fieldInputClass} w-40`}
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ProjectStatus | '')
          }
        >
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-muted">Cargando…</p>
        )}
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
            No se pudieron cargar los proyectos.
          </p>
        )}

        {!isLoading && !isError && projects.length === 0 && (
          <div className="grid place-items-center px-4 py-14 text-center">
            <Briefcase size={26} className="text-subtle" />
            <p className="mt-3 text-sm font-medium text-fg">
              {debounced || statusFilter
                ? 'Sin resultados'
                : 'Aún no tienes proyectos'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Crea uno o conviértelo desde una oportunidad ganada.
            </p>
          </div>
        )}

        {projects.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-subtle">
                  <th className="px-4 py-2.5 font-medium">Proyecto</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Inicio</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-line last:border-0 hover:bg-app/60"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(p)
                          setFormOpen(true)
                        }}
                        className="text-left font-medium text-fg"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) =>
                          status.mutate({
                            id: p.id,
                            value: e.target.value as ProjectStatus,
                          })
                        }
                        className={`cursor-pointer rounded-lg px-2 py-1 text-xs font-medium outline-none ${STATUS_CLASS[p.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {p.startDate ? p.startDate.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setDeleting(p)}
                          aria-label="Eliminar"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={editing}
      />

      <Modal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        title="Convertir oportunidad en proyecto"
      >
        <p className="text-sm text-muted">
          Elige una oportunidad ganada para crear su proyecto.
        </p>
        <select
          className={`${fieldInputClass} mt-3`}
          value={dealToConvert}
          onChange={(e) => setDealToConvert(e.target.value)}
        >
          <option value="">Selecciona una oportunidad…</option>
          {convertible.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
        {convertible.length === 0 && (
          <p className="mt-2 text-xs text-subtle">
            No hay oportunidades ganadas sin proyecto. Marca una oportunidad
            como ganada en el pipeline.
          </p>
        )}
        {convertError && (
          <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {convertError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConvertOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={!dealToConvert || convert.isPending}
            onClick={() => convert.mutate(dealToConvert)}
          >
            {convert.isPending ? 'Convirtiendo…' : 'Convertir'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar proyecto"
        message={`¿Seguro que quieres eliminar "${
          deleting?.name ?? ''
        }"? Se eliminarán también sus hitos.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
