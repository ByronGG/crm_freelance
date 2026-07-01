export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE'

export interface InvoiceProject {
  id: string
  name: string
}

export interface Payment {
  id: string
  amount: string
  paidAt: string
  method?: string | null
}

export interface Invoice {
  id: string
  number: string
  status: InvoiceStatus
  currency: string
  total: string
  issuedAt?: string | null
  dueDate?: string | null
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceDetail extends Invoice {
  project?: InvoiceProject | null
  payments: Payment[]
  amountPaid: number
  balance: number
}

/** Campos del formulario de factura. */
export interface InvoiceForm {
  projectId: string
  number: string
  currency: string
  total: string
  dueDate: string
}

/** Campos del formulario de pago. */
export interface PaymentForm {
  amount: string
  method: string
  paidAt: string
}
