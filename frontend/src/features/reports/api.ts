import { api } from '../../lib/api'

export interface MonthlyIncome {
  year: number
  month: number
  income: number
}

/** Ingresos cobrados mes a mes (últimos `months` meses). */
export async function getIncomeByMonth(months = 6): Promise<MonthlyIncome[]> {
  const { data } = await api.get<MonthlyIncome[]>('/reports/income-by-month', {
    params: { months },
  })
  return data
}
