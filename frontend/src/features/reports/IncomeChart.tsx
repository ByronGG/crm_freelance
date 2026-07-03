import { useQuery } from '@tanstack/react-query'

import { formatMoney } from '../../lib/format'
import { getIncomeByMonth } from './api'

const MONTH_LABEL = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

/** Gráfica de barras de ingresos cobrados por mes (SVG, sin dependencias). */
export function IncomeChart() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'income-by-month'],
    queryFn: () => getIncomeByMonth(6),
  })

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h2 className="text-sm font-medium text-fg">Ingresos por mes</h2>
      <p className="mt-0.5 text-xs text-muted">
        Pagos cobrados en los últimos 6 meses.
      </p>

      <div className="mt-4">
        {isLoading && <p className="text-sm text-muted">Cargando…</p>}
        {isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            No se pudo cargar la gráfica.
          </p>
        )}
        {data && <Bars data={data} />}
      </div>
    </div>
  )
}

function Bars({
  data,
}: {
  data: { year: number; month: number; income: number }[]
}) {
  const max = Math.max(...data.map((d) => d.income), 1)
  const allZero = data.every((d) => d.income === 0)

  if (allZero) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Aún no hay ingresos registrados.
      </p>
    )
  }

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => {
        const pct = Math.round((d.income / max) * 100)
        return (
          <div
            key={`${d.year}-${d.month}`}
            className="group flex flex-1 flex-col items-center gap-1.5"
          >
            <span className="text-[11px] font-medium text-fg opacity-0 transition-opacity group-hover:opacity-100">
              {formatMoney(d.income)}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-brand-500 transition-all"
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={formatMoney(d.income)}
              />
            </div>
            <span className="text-[11px] text-subtle">
              {MONTH_LABEL[d.month - 1]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
