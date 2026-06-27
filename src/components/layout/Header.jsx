import { useAuth } from '../../contexts/AuthContext'
import { Bell, Search } from 'lucide-react'
import Badge from '../ui/Badge'

export default function Header({ title }) {
  const { employee, isAdmin } = useAuth()

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-dark-700/50 bg-dark-900/40 backdrop-blur-lg">
      <div>
        <h2 className="text-lg font-semibold text-dark-100">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Role badge */}
        <Badge variant={isAdmin ? 'primary' : 'success'}>
          {isAdmin ? 'Admin' : 'Karyawan'}
        </Badge>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          {employee?.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={employee.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-dark-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
              {employee?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
