import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDate, formatTime, formatDateTime } from '../../utils/dateFormat'
import Header from '../../components/layout/Header'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import AttendanceDetail from '../../components/attendance/AttendanceDetail'
import {
  Clock, Calendar, Eye, ChevronLeft, ChevronRight,
  MapPin, LogIn, LogOut,
} from 'lucide-react'

export default function AttendanceHistory() {
  const { employee } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDetail, setSelectedDetail] = useState(null)

  useEffect(() => {
    if (employee) fetchHistory()
  }, [employee, month])

  async function fetchHistory() {
    try {
      setLoading(true)
      const [year, mon] = month.split('-')
      const startDate = new Date(year, mon - 1, 1)
      const endDate = new Date(year, mon, 0, 23, 59, 59)

      const { data, error } = await supabase
        .from('attendance')
        .select('*, employees(name, position, division, avatar_url)')
        .eq('employee_id', employee.id)
        .gte('server_timestamp', startDate.toISOString())
        .lte('server_timestamp', endDate.toISOString())
        .order('server_timestamp', { ascending: false })

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  function changeMonth(delta) {
    const [year, mon] = month.split('-').map(Number)
    const d = new Date(year, mon - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthLabel = (() => {
    const [year, mon] = month.split('-')
    return new Date(year, mon - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  })()

  // Group by date
  const grouped = attendance.reduce((acc, item) => {
    const date = formatDate(item.server_timestamp)
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  return (
    <>
      <Header title="Riwayat Absensi" />
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Month Selector */}
          <div className="glass rounded-2xl p-4 flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-dark-100 capitalize">{monthLabel}</p>
              <p className="text-xs text-dark-400">{attendance.length} record</p>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <LogIn className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-dark-100">
                {attendance.filter(a => a.type === 'clock_in').length}
              </p>
              <p className="text-xs text-dark-400">Clock In</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <LogOut className="w-5 h-5 text-sky-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-dark-100">
                {attendance.filter(a => a.type === 'clock_out').length}
              </p>
              <p className="text-xs text-dark-400">Clock Out</p>
            </div>
          </div>

          {/* History List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Clock className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Tidak ada data absensi untuk bulan ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date} className="glass rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-dark-700/50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-medium text-dark-200">{date}</span>
                  </div>
                  <div className="divide-y divide-dark-800/30">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="px-5 py-3 flex items-center justify-between hover:bg-dark-800/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedDetail(item)}
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={item.type === 'clock_in' ? 'success' : 'info'}>
                            {item.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                          </Badge>
                          <span className="text-sm font-mono text-dark-200">
                            {formatTime(item.server_timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-dark-500 max-w-[200px]">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.address || 'Lokasi tidak tersedia'}</span>
                          </div>
                          <Eye className="w-4 h-4 text-dark-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail Modal */}
          <Modal
            isOpen={!!selectedDetail}
            onClose={() => setSelectedDetail(null)}
            title="Detail Absensi"
            size="xl"
          >
            {selectedDetail && <AttendanceDetail data={selectedDetail} />}
          </Modal>
        </div>
      </main>
    </>
  )
}
