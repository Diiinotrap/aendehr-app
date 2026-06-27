import { useState, useEffect } from 'react'
import { PageWrapper } from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'
import { formatTime, getTodayRange } from '../../utils/dateFormat'
import {
  Users, UserCheck, UserX, Clock,
  TrendingUp, ArrowRight, ClipboardList,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    clockedIn: 0,
    notClockedIn: 0,
    clockedOut: 0,
  })
  const [todayAttendance, setTodayAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const { start, end } = getTodayRange()

      // Fetch total active employees
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Fetch today's attendance with employee info
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, employees(name, position, division, avatar_url)')
        .gte('server_timestamp', start)
        .lte('server_timestamp', end)
        .order('server_timestamp', { ascending: false })

      const clockInIds = new Set()
      const clockOutIds = new Set()
      
      attendance?.forEach(a => {
        if (a.type === 'clock_in') clockInIds.add(a.employee_id)
        if (a.type === 'clock_out') clockOutIds.add(a.employee_id)
      })

      setStats({
        totalEmployees: totalEmployees || 0,
        clockedIn: clockInIds.size,
        notClockedIn: (totalEmployees || 0) - clockInIds.size,
        clockedOut: clockOutIds.size,
      })

      setTodayAttendance(attendance || [])
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: 'Total Karyawan',
      value: stats.totalEmployees,
      icon: Users,
      color: 'from-primary-500 to-primary-600',
      shadow: 'shadow-primary-500/20',
    },
    {
      label: 'Sudah Clock In',
      value: stats.clockedIn,
      icon: UserCheck,
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/20',
    },
    {
      label: 'Belum Clock In',
      value: stats.notClockedIn,
      icon: UserX,
      color: 'from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/20',
    },
    {
      label: 'Sudah Clock Out',
      value: stats.clockedOut,
      icon: Clock,
      color: 'from-sky-500 to-sky-600',
      shadow: 'shadow-sky-500/20',
    },
  ]

  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome */}
        <div className="glass rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-dark-100">
              Selamat Datang! 👋
            </h3>
            <p className="text-dark-400 text-sm mt-1">
              Berikut ringkasan kehadiran hari ini
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/employees"
              className="px-4 py-2 rounded-xl bg-primary-500/15 text-primary-300 text-sm font-medium
                hover:bg-primary-500/25 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Karyawan
            </Link>
            <Link
              to="/admin/attendance"
              className="px-4 py-2 rounded-xl bg-accent-500/15 text-accent-400 text-sm font-medium
                hover:bg-accent-500/25 transition-colors flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Laporan
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`glass rounded-2xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-400 text-sm">{card.label}</p>
                  <p className="text-3xl font-bold text-dark-100 mt-1">
                    {loading ? (
                      <span className="skeleton inline-block w-12 h-9" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-lg ${card.shadow}`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              {/* Accent bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-50`} />
            </div>
          ))}
        </div>

        {/* Today's Attendance Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700/50 flex items-center justify-between">
            <h3 className="text-base font-semibold text-dark-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-400" />
              Kehadiran Hari Ini
            </h3>
            <Link
              to="/admin/attendance"
              className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : todayAttendance.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Belum ada data kehadiran hari ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-dark-400 uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Karyawan</th>
                    <th className="px-6 py-3 font-medium">Divisi</th>
                    <th className="px-6 py-3 font-medium">Tipe</th>
                    <th className="px-6 py-3 font-medium">Waktu</th>
                    <th className="px-6 py-3 font-medium">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/50">
                  {todayAttendance.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {item.employees?.avatar_url ? (
                            <img src={item.employees.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                              {item.employees?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-dark-100">{item.employees?.name}</p>
                            <p className="text-xs text-dark-500">{item.employees?.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-dark-300">{item.employees?.division || '-'}</td>
                      <td className="px-6 py-3">
                        <Badge variant={item.type === 'clock_in' ? 'success' : 'info'}>
                          {item.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-dark-300 font-mono">
                        {formatTime(item.server_timestamp)}
                      </td>
                      <td className="px-6 py-3 text-sm text-dark-400 max-w-[200px] truncate">
                        {item.address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
