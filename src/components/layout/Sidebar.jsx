import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
} from 'lucide-react'
import { useState } from 'react'

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: Users, label: 'Karyawan' },
  { to: '/admin/attendance', icon: ClipboardList, label: 'Absensi' },
]

const employeeLinks = [
  { to: '/employee/clock', icon: Fingerprint, label: 'Absensi' },
  { to: '/employee/history', icon: ClipboardList, label: 'Riwayat' },
]

export default function Sidebar() {
  const { isAdmin, employee, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const links = isAdmin ? adminLinks : employeeLinks

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 
        flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-[72px]' : 'w-64'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
          <Fingerprint className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold gradient-text">HRIS</h1>
            <p className="text-[10px] text-dark-400 -mt-0.5">Human Resource System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary-500/15 text-primary-300 shadow-lg shadow-primary-500/10'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
              }`
            }
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-dark-700/50">
        {!collapsed && employee && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-dark-200 truncate">{employee.name}</p>
            <p className="text-xs text-dark-500 truncate">{employee.position}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-800 border border-dark-600
          flex items-center justify-center text-dark-400 hover:text-dark-200 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
