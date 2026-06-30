import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ContactsPage } from './features/contacts/ContactsPage'
import { DealsBoardPage } from './features/deals/DealsBoardPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/deals" element={<DealsBoardPage />} />
          <Route
            path="/proposals"
            element={<PlaceholderPage title="Propuestas" />}
          />
          <Route
            path="/projects"
            element={<PlaceholderPage title="Proyectos" />}
          />
          <Route path="/tasks" element={<PlaceholderPage title="Tareas" />} />
          <Route
            path="/invoices"
            element={<PlaceholderPage title="Facturas" />}
          />
          <Route path="/settings" element={<PlaceholderPage title="Ajustes" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
