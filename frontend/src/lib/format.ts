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
