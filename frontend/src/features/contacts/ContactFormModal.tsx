import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Plus } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextArea, TextField, fieldInputClass } from '../../components/ui/TextField'
import {
  createCompany,
  createContact,
  listCompanies,
  updateContact,
} from './api'
import type { Contact, ContactInput } from './types'

const EMPTY: ContactInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  notes: '',
  companyId: '',
}

function fromContact(c: Contact): ContactInput {
  return {
    firstName: c.firstName,
    lastName: c.lastName ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    position: c.position ?? '',
    notes: c.notes ?? '',
    companyId: c.companyId ?? '',
  }
}

interface Props {
  open: boolean
  onClose: () => void
  contact: Contact | null
}

export function ContactFormModal({ open, onClose, contact }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ContactInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [newCompany, setNewCompany] = useState<string | null>(null)

  const companies = useQuery({
    queryKey: ['companies'],
    queryFn: listCompanies,
    enabled: open,
  })

  // Reinicia el formulario cada vez que se abre (alta o edición).
  useEffect(() => {
    if (open) {
      setForm(contact ? fromContact(contact) : EMPTY)
      setError(null)
      setNewCompany(null)
    }
  }, [open, contact])

  const save = useMutation({
    mutationFn: (input: ContactInput) =>
      contact ? updateContact(contact.id, input) : createContact(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      onClose()
    },
    onError: (err) => {
      const status = (err as AxiosError)?.response?.status
      setError(
        status === 400
          ? 'Revisa los datos: hay algún campo con formato inválido.'
          : 'No se pudo guardar el contacto.',
      )
    },
  })

  const addCompany = useMutation({
    mutationFn: (name: string) => createCompany(name),
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setForm((f) => ({ ...f, companyId: company.id }))
      setNewCompany(null)
    },
  })

  function update<K extends keyof ContactInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
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
      title={contact ? 'Editar contacto' : 'Nuevo contacto'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Nombre"
            required
            autoFocus
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
          <TextField
            label="Apellido"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
        </div>

        <TextField
          label="Email"
          type="email"
          placeholder="contacto@empresa.com"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Teléfono"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <TextField
            label="Cargo"
            value={form.position}
            onChange={(e) => update('position', e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm text-muted">Empresa</span>
            {newCompany === null && (
              <button
                type="button"
                onClick={() => setNewCompany('')}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-fg hover:underline"
              >
                <Plus size={13} /> Nueva
              </button>
            )}
          </div>

          {newCompany === null ? (
            <select
              className={fieldInputClass}
              value={form.companyId}
              onChange={(e) => update('companyId', e.target.value)}
            >
              <option value="">Sin empresa</option>
              {companies.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                className={fieldInputClass}
                placeholder="Nombre de la empresa"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
              />
              <Button
                type="button"
                variant="primary"
                disabled={!newCompany.trim() || addCompany.isPending}
                onClick={() => addCompany.mutate(newCompany)}
              >
                Crear
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setNewCompany(null)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        <TextArea
          label="Notas"
          rows={3}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
        />

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
