import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Shield, Trash2, UserPlus, Users } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { TextField } from '../../components/ui/TextField'
import { formatDate } from '../../lib/format'
import { initialsFromName } from '../../lib/names'
import { useAuth } from '../auth/AuthContext'
import { createMember, deleteMember, listTeam } from './api'
import type { MemberInput, TeamMember } from './types'

const EMPTY: MemberInput = { name: '', email: '', password: '' }

export function TeamPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = user?.role === 'ADMIN'

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<MemberInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<TeamMember | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['team'],
    queryFn: listTeam,
  })

  const create = useMutation({
    mutationFn: (input: MemberInput) => createMember(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setFormOpen(false)
      setForm(EMPTY)
    },
    onError: (err) => {
      const status = (err as AxiosError)?.response?.status
      setError(
        status === 409
          ? 'Ese email ya está registrado.'
          : status === 400
            ? 'Revisa los datos (contraseña de al menos 8 caracteres).'
            : 'No se pudo crear el miembro.',
      )
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setDeleting(null)
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    create.mutate(form)
  }

  const members = data ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Equipo</h1>
          <p className="mt-1 text-sm text-muted">
            Miembros que comparten la cartera de la cuenta.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setError(null)
              setForm(EMPTY)
              setFormOpen(true)
            }}
          >
            <UserPlus size={16} /> Nuevo miembro
          </Button>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-muted">Cargando…</p>
        )}
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
            No se pudo cargar el equipo.
          </p>
        )}

        {!isLoading && !isError && members.length === 0 && (
          <div className="grid place-items-center px-4 py-14 text-center">
            <Users size={26} className="text-subtle" />
            <p className="mt-3 text-sm text-muted">Sin miembros todavía.</p>
          </div>
        )}

        {members.map((m) => {
          const isOwner = m.role === 'ADMIN'
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-medium text-brand-fg">
                {initialsFromName(m.name) || '?'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">
                  {m.name}
                  {m.id === user?.id && (
                    <span className="ml-1.5 text-xs text-subtle">(tú)</span>
                  )}
                </p>
                <p className="truncate text-xs text-subtle">{m.email}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOwner
                    ? 'bg-brand-soft text-brand-fg'
                    : 'bg-app text-muted'
                }`}
              >
                {isOwner && <Shield size={11} />}
                {isOwner ? 'Administrador' : 'Miembro'}
              </span>
              <span className="hidden w-24 text-right text-xs text-subtle sm:block">
                {formatDate(m.createdAt)}
              </span>
              {isAdmin && !isOwner ? (
                <button
                  type="button"
                  onClick={() => setDeleting(m)}
                  aria-label={`Quitar a ${m.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              ) : (
                <span className="w-8 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nuevo miembro"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="Nombre"
            required
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            label="Contraseña temporal"
            type="password"
            required
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? 'Creando…' : 'Crear miembro'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Quitar miembro"
        message={`¿Quitar a ${deleting?.name ?? ''} de la cuenta? Perderá el acceso.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
