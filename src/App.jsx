import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { FullPageLoader } from './components/ui/LoadingSpinner'

// Layouts
import AdminLayout from './components/layout/AdminLayout'
import EmployeeLayout from './components/layout/EmployeeLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import Employees from './pages/admin/Employees'
import AttendanceReport from './pages/admin/AttendanceReport'
import ClockPage from './pages/employee/ClockPage'
import AttendanceHistory from './pages/employee/AttendanceHistory'

// Protected Route wrapper
function ProtectedRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/employee/clock'} replace />
  }
  return children
}

// Public Route wrapper (redirect if already logged in)
function PublicRoute({ children }) {
  const { user, role, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (user && role) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/employee/clock'} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<AttendanceReport />} />
      </Route>

      {/* Employee Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRole="employee">
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="clock" replace />} />
        <Route path="clock" element={<ClockPage />} />
        <Route path="history" element={<AttendanceHistory />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
