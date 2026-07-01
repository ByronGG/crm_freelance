import { api } from '../../lib/api'
import type {
  Invoice,
  InvoiceDetail,
  InvoiceForm,
  InvoiceStatus,
  PaymentForm,
} from './types'

interface ListParams {
  status?: InvoiceStatus
  search?: string
}

export async function listInvoices(params: ListParams = {}): Promise<Invoice[]> {
  const query: Record<string, string> = {}
  if (params.status) query.status = params.status
  if (params.search) query.search = params.search
  const { data } = await api.get<Invoice[]>('/invoices', {
    params: Object.keys(query).length ? query : undefined,
  })
  return data
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  const { data } = await api.get<InvoiceDetail>(`/invoices/${id}`)
  return data
}

export async function createInvoice(form: InvoiceForm): Promise<Invoice> {
  const { data } = await api.post<Invoice>('/invoices', {
    projectId: form.projectId,
    currency: form.currency,
    total: form.total.trim() ? Number(form.total) : 0,
    ...(form.number.trim() ? { number: form.number.trim() } : {}),
    dueDate: form.dueDate || null,
  })
  return data
}

export async function updateInvoice(
  id: string,
  form: InvoiceForm,
): Promise<Invoice> {
  const { data } = await api.patch<Invoice>(`/invoices/${id}`, {
    ...(form.number.trim() ? { number: form.number.trim() } : {}),
    currency: form.currency,
    total: form.total.trim() ? Number(form.total) : 0,
    dueDate: form.dueDate || null,
  })
  return data
}

export async function changeStatus(
  id: string,
  status: InvoiceStatus,
): Promise<Invoice> {
  const { data } = await api.patch<Invoice>(`/invoices/${id}/status`, { status })
  return data
}

export async function addPayment(
  id: string,
  form: PaymentForm,
): Promise<InvoiceDetail> {
  const { data } = await api.post<InvoiceDetail>(`/invoices/${id}/payments`, {
    amount: Number(form.amount),
    ...(form.method.trim() ? { method: form.method.trim() } : {}),
    ...(form.paidAt ? { paidAt: form.paidAt } : {}),
  })
  return data
}

export async function removePayment(
  id: string,
  paymentId: string,
): Promise<InvoiceDetail> {
  const { data } = await api.delete<InvoiceDetail>(
    `/invoices/${id}/payments/${paymentId}`,
  )
  return data
}

export async function deleteInvoice(id: string): Promise<void> {
  await api.delete(`/invoices/${id}`)
}
