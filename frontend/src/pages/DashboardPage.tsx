import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import { useAuth } from '../features/auth/AuthContext'

interface DashboardSummary {
  pipeline: {
    openCount: number
    openValue: number
    conversionRate: number
  }
  receivables: { pendingTotal: number; overdueCount: number }
  monthIncome: number
  pendingToday: { count: number }
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p
        className={[
          'mt-1 text-2xl font-medium',
          accent ? 'text-brand-fg' : 'text-fg',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardSummary>('/dashboard')).data,
  })

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-medium text-fg">
        Hola, {user?.name?.split(' ')[0]}
      </h1>
      <p className="mt-1 text-sm text-muted">Este es el estado de tu negocio.</p>

      {isLoading && (
        <p className="mt-6 text-sm text-muted">Cargando métricas…</p>
      )}
      {isError && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">
          No se pudieron cargar las métricas.
        </p>
      )}

      {data && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Valor en pipeline"
            value={money.format(data.pipeline.openValue)}
          />
          <MetricCard
            label="Oportunidades abiertas"
            value={String(data.pipeline.openCount)}
          />
          <MetricCard
            label="Por cobrar"
            value={money.format(data.receivables.pendingTotal)}
          />
          <MetricCard
            label="Ingresos del mes"
            value={money.format(data.monthIncome)}
            accent
          />
        </div>
      )}

      {data && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Tareas de hoy"
            value={String(data.pendingToday.count)}
          />
          <MetricCard
            label="Facturas vencidas"
            value={String(data.receivables.overdueCount)}
          />
          <MetricCard
            label="Tasa de conversión"
            value={`${Math.round(data.pipeline.conversionRate * 100)}%`}
          />
        </div>
      )}
    </div>
  )
}
