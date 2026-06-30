import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TextField, fieldInputClass } from '../../components/ui/TextField'
import { listContacts } from '../contacts/api'
import { createDeal, deleteDeal, updateDeal } from './api'
import type { Deal, DealInput } from './types'

const EMPTY: DealInput = {
  title: '',
  value: '',
  contactId: '',
  expectedClose: '',
}

function fromDeal(d: Deal): DealInput {
  return {
    title: d.title,
    value: String(Number(d.value)),
    contactId: d.contactId ?? '',
    expectedClose: d.expectedClose ? d.expectedClose.slice(0, 10) : '',
  }
}

interface Props {
  open: boolean
  onClose: () => void
  deal: Deal | null
}

export function DealFormModal({ open, onClose, deal }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<DealInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const contacts = useQuery({
    queryKey: ['contacts', ''],
    queryFn: () => listContacts(),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      setForm(deal ? fromDeal(deal) : EMPTY)
      setError(null)
    }
  }, [open, deal])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['deals', 'board'] })
  }

  const save = useMutation({
    mutationFn: (input: DealInput) =>
      deal ? updateDeal(deal.id, input) : createDeal(input),
    onSuccess: () => {
      invalidate()
      onClose()
    },
    onError: (err) => {
      const status = (err as AxiosError)?.response?.status
      setError(
        status === 400
          ? 'Revisa los datos: hay algún campo con formato inválido.'
          : 'No se pudo guardar la oportunidad.',
      )
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteDeal(deal!.id),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  function update<K extends keyof DealInput>(key: K, value: string) {
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
      title={deal ? 'Editar oportunidad' : 'Nueva oportunidad'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Título"
          required
          autoFocus
          placeholder="Rediseño del sitio web"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Valor estimado"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={form.value}
            onChange={(e) => update('value', e.target.value)}
          />
          <TextField
            label="Cierre estimado"
            type="date"
            value={form.expectedClose}
            onChange={(e) => update('expectedClose', e.target.value)}
          />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-muted">Contacto</span>
          <select
            className={fieldInputClass}
            value={form.contactId}
            onChange={(e) => update('contactId', e.target.value)}
          >
            <option value="">Sin contacto</option>
            {contacts.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {[c.firstName, c.lastName].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          {deal ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-500/10"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={save.isPending}>
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
