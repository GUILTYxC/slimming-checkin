import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './views/Home'
import PeriodForm from './views/PeriodForm'
import Dashboard from './views/Dashboard'
import DailyEntry from './views/DailyEntry'
import WeeklySummary from './views/WeeklySummary'
import Statistics from './views/Statistics'
import Login from './views/Login'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">加载中...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">加载中...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="period/new" element={<PeriodForm />} />
        <Route path="period/:id" element={<Dashboard />} />
        <Route path="period/:id/edit" element={<PeriodForm />} />
        <Route path="period/:id/daily" element={<DailyEntry />} />
        <Route path="period/:id/weekly" element={<WeeklySummary />} />
        <Route path="period/:id/stats" element={<Statistics />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}