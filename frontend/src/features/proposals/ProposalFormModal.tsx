import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import {
  TextField,
  fieldBase,
  fieldInputClass,
} from '../../components/ui/TextField'
import { CURRENCIES } from '../../lib/currencies'
import { formatAmount } from '../../lib/format'
import { listContacts } from '../contacts/api'
import { listDeals } from '../deals/api'
import { createProposal, getProposal, updateProposal } from './api'
import type { ItemForm, Proposal, ProposalForm } from './types'

const EMPTY_ITEM: ItemForm = { description: '', quantity: '1', unitPrice: '0' }

const EMPTY: ProposalForm = {
  title: '',
  currency: 'USD',
  notes: '',
  contactId: '',
  dealId: '',
  items: [{ ...EMPTY_ITEM }],
}

function liveTotal(items: ItemForm[]): number {
  return items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0,
  )
}

interface Props {
  open: boolean
  onClose: () => void
  proposal: Proposal | null
}

export function ProposalFormModal({ open, onClose, proposal }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProposalForm>(EMPTY)
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

  // En edición, carga el detalle (con ítems) para poblar el formulario.
  const detail = useQuery({
    queryKey: ['proposals', proposal?.id],
    queryFn: () => getProposal(proposal!.id),
    enabled: open && !!proposal,
  })

  useEffect(() => {
    if (!open) return
    setError(null)
    if (!proposal) {
      setForm({ ...EMPTY, items: [{ ...EMPTY_ITEM }] })
    } else if (detail.data) {
      setForm({
        title: detail.data.title,
        currency: detail.data.currency,
        notes: detail.data.notes ?? '',
        contactId: detail.data.contactId ?? '',
        dealId: detail.data.dealId ?? '',
        items:
          detail.data.items.length > 0
            ? detail.data.items.map((i) => ({
                description: i.description,
                quantity: String(Number(i.quantity)),
                unitPrice: String(Number(i.unitPrice)),
              }))
            : [{ ...EMPTY_ITEM }],
      })
    }
  }, [open, proposal, detail.data])

  const save = useMutation({
    mutationFn: async (f: ProposalForm) => {
      if (proposal) await updateProposal(proposal.id, f)
      else await createProposal(f)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      onClose()
    },
    onError: (err) => {
      const status = (err as AxiosError)?.response?.status
      setError(
        status === 400
          ? 'Revisa los datos: hay algún campo con formato inválido.'
          : 'No se pudo guardar la propuesta.',
      )
    },
  })

  function setField<K extends keyof ProposalForm>(
    key: K,
    value: ProposalForm[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setItem(index: number, key: keyof ItemForm, value: string) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) =>
        i === index ? { ...it, [key]: value } : it,
      ),
    }))
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
  }

  function removeItem(index: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    save.mutate(form)
  }

  const loadingEdit = !!proposal && detail.isLoading
  const total = liveTotal(form.items)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={proposal ? 'Editar propuesta' : 'Nueva propuesta'}
    >
      {loadingEdit ? (
        <p className="py-6 text-center text-sm text-muted">Cargando…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <TextField
              label="Título"
              required
              autoFocus
              placeholder="Propuesta de rediseño"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm text-muted">Moneda</span>
              <select
                className={fieldInputClass}
                value={form.currency}
                onChange={(e) => setField('currency', e.target.value)}
              >
                {(CURRENCIES.includes(form.currency)
                  ? CURRENCIES
                  : [form.currency, ...CURRENCIES]
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
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
              <span className="mb-1.5 block text-sm text-muted">
                Oportunidad
              </span>
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

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-muted">Ítems</span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-fg hover:underline"
              >
                <Plus size={13} /> Añadir ítem
              </button>
            </div>

            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${fieldBase} min-w-0 flex-1`}
                    placeholder="Descripción"
                    value={item.description}
                    onChange={(e) =>
                      setItem(i, 'description', e.target.value)
                    }
                  />
                  <input
                    className={`${fieldBase} w-16 shrink-0 text-right`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cant."
                    value={item.quantity}
                    onChange={(e) => setItem(i, 'quantity', e.target.value)}
                  />
                  <input
                    className={`${fieldBase} w-24 shrink-0 text-right`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio"
                    value={item.unitPrice}
                    onChange={(e) => setItem(i, 'unitPrice', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label="Quitar ítem"
                    className="grid h-10 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.items.length === 0 && (
                <p className="py-2 text-center text-xs text-subtle">
                  Sin ítems. El total será 0.
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm text-muted">Total</span>
              <span className="text-base font-medium text-fg">
                {formatAmount(total, form.currency || 'USD')}
              </span>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Notas</span>
            <textarea
              rows={2}
              className={`${fieldInputClass} h-auto resize-y py-2`}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
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
      )}
    </Modal>
  )
}
