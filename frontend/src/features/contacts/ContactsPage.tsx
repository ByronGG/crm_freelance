import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Pencil, Plus, Search, Trash2, Upload, Users } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { fieldInputClass } from '../../components/ui/TextField'
import { useDebounce } from '../../lib/useDebounce'
import { fullName, initials } from '../../lib/names'
import { TagChip } from '../tags/TagChip'
import { listTags, listTagsForEntities } from '../tags/api'
import type { Tag } from '../tags/types'
import { ContactFormModal } from './ContactFormModal'
import {
  deleteContact,
  exportContactsCsv,
  importContactsCsv,
  listContacts,
  type ImportResult,
} from './api'
import type { Contact } from './types'

export function ContactsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const [tagFilter, setTagFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts', debounced],
    queryFn: () => listContacts(debounced || undefined),
  })

  // Catálogo de etiquetas (para el filtro) y chips de las filas visibles.
  const tags = useQuery({ queryKey: ['tags'], queryFn: listTags })
  const ids = useMemo(() => (data ?? []).map((c) => c.id), [data])
  const entityTags = useQuery({
    queryKey: ['tags', 'entities', 'CONTACT', ids.join(',')],
    queryFn: () => listTagsForEntities('CONTACT', ids),
    enabled: ids.length > 0,
  })

  // Mapa contactId → etiquetas, a partir de la respuesta batch.
  const tagsByContact = useMemo(() => {
    const map = new Map<string, Tag[]>()
    for (const { entityId, tag } of entityTags.data ?? []) {
      const list = map.get(entityId) ?? []
      list.push(tag)
      map.set(entityId, list)
    }
    return map
  }, [entityTags.data])

  const remove = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setDeleting(null)
    },
  })

  const exportCsv = useMutation({ mutationFn: () => exportContactsCsv() })

  const importCsv = useMutation({
    mutationFn: (csv: string) => importContactsCsv(csv),
    onSuccess: (result) => {
      setImportResult(result)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-subir el mismo archivo
    if (!file) return
    const text = await file.text()
    importCsv.mutate(text)
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(contact: Contact) {
    setEditing(contact)
    setFormOpen(true)
  }

  const contacts = (data ?? []).filter(
    (c) =>
      !tagFilter ||
      (tagsByContact.get(c.id) ?? []).some((t) => t.id === tagFilter),
  )

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-fg">Contactos</h1>
          <p className="mt-1 text-sm text-muted">
            Personas con las que haces negocio.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFilePicked}
          />
          <Button
            variant="secondary"
            onClick={() => fileInput.current?.click()}
            disabled={importCsv.isPending}
          >
            <Upload size={16} /> {importCsv.isPending ? 'Importando…' : 'Importar'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportCsv.mutate()}
            disabled={exportCsv.isPending || contacts.length === 0}
          >
            <Download size={16} /> Exportar
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo contacto
          </Button>
        </div>
      </div>

      {importResult && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <div className="text-sm">
            <p className="font-medium text-fg">
              Importación: {importResult.created} creados
              {importResult.skipped > 0
                ? `, ${importResult.skipped} omitidos`
                : ''}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-xs text-muted">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>y {importResult.errors.length - 5} más…</li>
                )}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setImportResult(null)}
            className="text-xs text-muted hover:text-fg"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
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
        {(tags.data?.length ?? 0) > 0 && (
          <select
            className={`${fieldInputClass} w-44`}
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">Todas las etiquetas</option>
            {tags.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
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
              {debounced || tagFilter ? 'Sin resultados' : 'Aún no tienes contactos'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {debounced || tagFilter
                ? 'Prueba con otra búsqueda o filtro.'
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
                    onClick={() => navigate(`/contacts/${c.id}`)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-app/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-medium text-brand-fg">
                          {initials(c.firstName, c.lastName) || '?'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">
                            {fullName(c.firstName, c.lastName)}
                          </p>
                          {c.position && (
                            <p className="truncate text-xs text-subtle">
                              {c.position}
                            </p>
                          )}
                          {(tagsByContact.get(c.id)?.length ?? 0) > 0 && (
                            <span className="mt-1 flex flex-wrap gap-1">
                              {tagsByContact.get(c.id)?.slice(0, 3).map((t) => (
                                <TagChip key={t.id} tag={t} />
                              ))}
                              {(tagsByContact.get(c.id)?.length ?? 0) > 3 && (
                                <span className="text-xs text-subtle">
                                  +{(tagsByContact.get(c.id)?.length ?? 0) - 3}
                                </span>
                              )}
                            </span>
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
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(c)
                          }}
                          aria-label="Editar"
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-fg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleting(c)
                          }}
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
          deleting ? fullName(deleting.firstName, deleting.lastName) : ''
        }? Esta acción no se puede deshacer.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
