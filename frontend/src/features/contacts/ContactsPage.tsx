import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { fieldInputClass } from '../../components/ui/TextField'
import { useDebounce } from '../../lib/useDebounce'
import { ContactFormModal } from './ContactFormModal'
import { deleteContact, listContacts } from './api'
import type { Contact } from './types'

function fullName(c: Contact): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ')
}

function initials(c: Contact): string {
  return [c.firstName?.[0], c.lastName?.[0]].filter(Boolean).join('').toUpperCase()
}

export function ContactsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts', debounced],
    queryFn: () => listContacts(debounced || undefined),
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setDeleting(null)
    },
  })

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(contact: Contact) {
    setEditing(contact)
    setFormOpen(true)
  }

  const contacts = data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Contactos</h1>
          <p className="mt-1 text-sm text-muted">
            Personas con las que haces negocio.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo contacto
        </Button>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
        />
        <input
          className={`${fieldInputClass} pl-9`}
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-muted">Cargando…</p>
        )}
        {isError && (
          <p className="px-4 py-10 text-center text-sm text-red-600 dark:text-red-400">
            No se pudieron cargar los contactos.
          </p>
        )}

        {!isLoading && !isError && contacts.length === 0 && (
          <div className="grid place-items-center px-4 py-14 text-center">
            <Users size={26} className="text-subtle" />
            <p className="mt-3 text-sm font-medium text-fg">
              {debounced ? 'Sin resultados' : 'Aún no tienes contactos'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {debounced
                ? 'Prueba con otra búsqueda.'
                : 'Crea tu primer contacto para empezar.'}
            </p>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-subtle">
                  <th className="px-4 py-2.5 font-medium">Contacto</th>
                  <th className="px-4 py-2.5 font-medium">Empresa</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Teléfono</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-0 hover:bg-app/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-medium text-brand-fg">
                          {initials(c) || '?'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">
                            {fullName(c)}
                          </p>
                          {c.position && (
                            <p className="truncate text-xs text-subtle">
                              {c.position}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {c.company?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          aria-label="Editar"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(c)}
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

      <ContactFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contact={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar contacto"
        message={`¿Seguro que quieres eliminar a ${
          deleting ? fullName(deleting) : ''
        }? Esta acción no se puede deshacer.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
