import { Route, Routes } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'

interface Health {
  status: string
  service: string
  timestamp: string
}

function Home() {
  // Verifica la conexión con el backend (GET /api/health).
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get<Health>('/health')).data,
  })

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">CRM Freelancers</h1>
        <p className="mt-1 text-sm text-slate-500">
          Andamiaje listo. Empieza a construir los módulos.
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm">
          <p className="font-medium text-slate-700">Estado del backend</p>
          {isLoading && <p className="text-slate-500">Comprobando…</p>}
          {isError && (
            <p className="text-red-600">
              Sin conexión. Levanta el backend en el puerto 3000.
            </p>
          )}
          {data && (
            <p className="text-emerald-600">
              {data.status} · {data.service}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
