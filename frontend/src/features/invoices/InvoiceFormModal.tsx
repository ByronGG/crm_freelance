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
import { listProjects } from '../projects/api'
import {
  addPayment,
  createInvoice,
  getInvoice,
  removePayment,
  updateInvoice,
} from './api'
import type { Invoice, InvoiceForm, PaymentForm } from './types'

const EMPTY: InvoiceForm = {
  projectId: '',
  number: '',
  currency: 'USD',
  total: '',
  dueDate: '',
}

const EMPTY_PAYMENT: PaymentForm = { amount: '', method: '', paidAt: '' }

function fromInvoice(inv: Invoice): InvoiceForm {
  return {
    projectId: inv.projectId,
    number: inv.number,
    currency: inv.currency,
    total: String(Number(inv.total)),
    dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '',
  }
}

interface Props {
  open: boolean
  onClose: () => void
  invoice: Invoice | null
}

export function InvoiceFormModal({ open, onClose, invoice }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<InvoiceForm>(EMPTY)
  const [payment, setPayment] = useState<PaymentForm>(EMPTY_PAYMENT)
  const [error, setError] = useState<string | null>(null)

  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => listProjects(),
    enabled: open && !invoice,
  })

  const detail = useQuery({
    queryKey: ['invoices', invoice?.id],
    queryFn: () => getInvoice(invoice!.id),
    enabled: open && !!invoice,
  })

  useEffect(() => {
    if (!open) return
    setError(null)
    setPayment(EMPTY_PAYMENT)
    setForm(invoice ? fromInvoice(invoice) : EMPTY)
  }, [open, invoice])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['invoices'] })

  const save = useMutation({
    mutationFn: (f: InvoiceForm) =>
      invoice ? updateInvoice(invoice.id, f) : createInvoice(f),
    onSuccess: () => {
      invalidate()
      onClose()
    },
    onError: (err) => {
      const status = (err as AxiosError)?.response?.status
      setError(
        status === 409
          ? 'Ya existe una factura con ese número.'
          : status === 400
            ? 'Revisa los datos: hay algún campo con formato inválido.'
            : 'No se pudo guardar la factura.',
      )
    },
  })

  const pay = useMutation({
    mutationFn: (f: PaymentForm) => addPayment(invoice!.id, f),
    onSuccess: () => {
      setPayment(EMPTY_PAYMENT)
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['invoices', invoice!.id] })
    },
  })

  const unpay = useMutation({
    mutationFn: (paymentId: string) => removePayment(invoice!.id, paymentId),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['invoices', invoice!.id] })
    },
  })

  function setField<K extends keyof InvoiceForm>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    save.mutate(form)
  }

  const data = detail.data
  const currencyOptions = CURRENCIES.includes(form.currency)
    ? CURRENCIES
    : [form.currency, ...CURRENCIES]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={invoice ? `Factura ${invoice.number}` : 'Nueva factura'}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {invoice ? (
          <p className="text-sm text-muted">
            Proyecto:{' '}
            <span className="text-fg">{data?.project?.name ?? '…'}</span>
          </p>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Proyecto</span>
            <select
              required
              className={fieldInputClass}
              value={form.projectId}
              onChange={(e) => setField('projectId', e.target.value)}
            >
              <option value="" disabled>
                Selecciona un proyecto
              </option>
              {projects.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {projects.data?.length === 0 && (
              <span className="mt-1 block text-xs text-subtle">
                No tienes proyectos. Crea uno primero (desde una oportunidad
                ganada).
              </span>
            )}
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Número"
            placeholder={invoice ? '' : 'Automático'}
            value={form.number}
            onChange={(e) => setField('number', e.target.value)}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Moneda</span>
            <select
              className={fieldInputClass}
              value={form.currency}
              onChange={(e) => setField('currency', e.target.value)}
            >
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Total"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={form.total}
            onChange={(e) => setField('total', e.target.value)}
          />
          <TextField
            label="Vencimiento"
            type="date"
            value={form.dueDate}
            onChange={(e) => setField('dueDate', e.target.value)}
          />
        </div>

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

      {invoice && data && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-app p-2.5">
              <p className="text-xs text-muted">Total</p>
              <p className="mt-0.5 text-sm font-medium text-fg">
                {formatAmount(data.total, data.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-app p-2.5">
              <p className="text-xs text-muted">Pagado</p>
              <p className="mt-0.5 text-sm font-medium text-brand-fg">
                {formatAmount(data.amountPaid, data.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-app p-2.5">
              <p className="text-xs text-muted">Saldo</p>
              <p className="mt-0.5 text-sm font-medium text-fg">
                {formatAmount(data.balance, data.currency)}
              </p>
            </div>
          </div>

          <p className="mb-2 mt-4 text-sm text-muted">Pagos</p>
          <div className="space-y-1.5">
            {data.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"
              >
                <span className="font-medium text-fg">
                  {formatAmount(p.amount, data.currency)}
                </span>
                <span className="text-xs text-muted">
                  {p.method ? `${p.method} · ` : ''}
                  {p.paidAt.slice(0, 10)}
                </span>
                <button
                  type="button"
                  onClick={() => unpay.mutate(p.id)}
                  aria-label="Quitar pago"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-app hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {data.payments.length === 0 && (
              <p className="py-1 text-xs text-subtle">Sin pagos registrados.</p>
            )}
          </div>

          <div className="mt-2.5 flex gap-2">
            <input
              className={`${fieldBase} w-24 shrink-0 text-right`}
              type="number"
              min="0"
              step="0.01"
              placeholder="Importe"
              value={payment.amount}
              onChange={(e) =>
                setPayment((p) => ({ ...p, amount: e.target.value }))
              }
            />
            <input
              className={`${fieldBase} min-w-0 flex-1`}
              placeholder="Método (opcional)"
              value={payment.method}
              onChange={(e) =>
                setPayment((p) => ({ ...p, method: e.target.value }))
              }
            />
            <input
              className={`${fieldBase} w-40 shrink-0`}
              type="date"
              value={payment.paidAt}
              onChange={(e) =>
                setPayment((p) => ({ ...p, paidAt: e.target.value }))
              }
            />
            <Button
              type="button"
              variant="primary"
              disabled={!payment.amount.trim() || pay.isPending}
              onClick={() => pay.mutate(payment)}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
