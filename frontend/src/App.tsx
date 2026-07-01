import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ContactsPage } from './features/contacts/ContactsPage'
import { DealsBoardPage } from './features/deals/DealsBoardPage'
import { ProposalsPage } from './features/proposals/ProposalsPage'
import { InvoicesPage } from './features/invoices/InvoicesPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { TasksPage } from './features/tasks/TasksPage'
import { SettingsPage } from './features/settings/SettingsPage'

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
          <Route path="/proposals" element={<ProposalsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
