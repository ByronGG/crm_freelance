const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Formatea un importe (number o string Decimal) como moneda USD. */
export function formatMoney(value: number | string): string {
  return money.format(Number(value))
}

/** Formatea un importe con un código de moneda concreto (USD, EUR, MXN…). */
export function formatAmount(value: number | string, currency = 'USD'): string {
  const n = Number(value)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `${n.toFixed(2)} ${currency}`
  }
}

const dateFmt = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Formatea una fecha ISO como "01 jul 2026" (vacío → guion). */
export function formatDate(value?: string | null): string {
  if (!value) return '—'
  return dateFmt.format(new Date(value))
}

/** Formatea fecha y hora, p. ej. "01 jul 2026, 14:30". */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  return dateTimeFmt.format(new Date(value))
}
