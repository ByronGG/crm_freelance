const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Formatea un importe (number o string Decimal) como moneda. */
export function formatMoney(value: number | string): string {
  return money.format(Number(value))
}
