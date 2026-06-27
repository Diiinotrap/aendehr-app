import { useState, useEffect } from 'react'
import { PageWrapper } from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'
import { formatDateTime, formatTime, formatDate } from '../../utils/dateFormat'
import { exportAttendanceToExcel } from '../../utils/exportExcel'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import AttendanceDetail from '../../components/attendance/AttendanceDetail'
import {
  Download, Search, Filter, Calendar, Clock,
  MapPin, Eye, ChevronLeft, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AttendanceReport() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1) // First day of month
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [filterEmployee, setFilterEmployee] = useState('')
  const [employees, setEmployees] = useState([])
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [page, setPage] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [dateFrom, dateTo, filterEmployee, page])

  async function fetchEmployees() {
    const { data } = await supabase
      .from('employees')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    setEmployees(data || [])
  }

  async function fetchAttendance() {
    try {
      setLoading(true)
      let query = supabase
        .from('attendance')
        .select('*, employees(name, position, division, avatar_url)', { count: 'exact' })
        .gte('server_timestamp', `${dateFrom}T00:00:00`)
        .lte('server_timestamp', `${dateTo}T23:59:59`)
        .order('server_timestamp', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (filterEmployee) {
        query = query.eq('employee_id', filterEmployee)
      }

      const { data, error, count } = await query

      if (error) throw error
      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('Gagal memuat data absensi')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      toast.loading('Menyiapkan file Excel...', { id: 'export' })

      let query = supabase
        .from('attendance')
        .select('*, employees(name, position, division)')
        .gte('server_timestamp', `${dateFrom}T00:00:00`)
        .lte('server_timestamp', `${dateTo}T23:59:59`)
        .order('server_timestamp', { ascending: false })

      if (filterEmployee) {
        query = query.eq('employee_id', filterEmployee)
      }

      const { data, error } = await query
      if (error) throw error

      exportAttendanceToExcel(data)
      toast.success('File Excel berhasil diunduh!', { id: 'export' })
    } catch (error) {
      toast.error('Gagal export data', { id: 'export' })
    }
  }

  return (
    <PageWrapper title="Laporan Absensi">
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-dark-400 mb-1">Dari Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(0) }}
                  className="pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Sampai Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setPage(0) }}
                  className="pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Karyawan</label>
              <select
                value={filterEmployee}
                onChange={e => { setFilterEmployee(e.target.value); setPage(0) }}
                className="px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all min-w-[180px]"
              >
                <option value="">Semua Karyawan</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div className="ml-auto">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 rounded-xl bg-accent-500/15 text-accent-400 text-sm font-medium 
                  hover:bg-accent-500/25 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 w-full" />)}
            </div>
          ) : attendance.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">Tidak ada data absensi untuk periode ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-dark-400 uppercase tracking-wider border-b border-dark-700/50">
                    <th className="px-6 py-3 font-medium">Karyawan</th>
                    <th className="px-6 py-3 font-medium">Tipe</th>
                    <th className="px-6 py-3 font-medium">Tanggal</th>
                    <th className="px-6 py-3 font-medium">Waktu</th>
                    <th className="px-6 py-3 font-medium">Lokasi</th>
                    <th className="px-6 py-3 font-medium text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/50">
                  {attendance.map((item) => (
                    <tr key={item.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {item.employees?.avatar_url ? (
                            <img src={item.employees.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                              {item.employees?.name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-dark-100">{item.employees?.name}</p>
                            <p className="text-xs text-dark-500">{item.employees?.division}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={item.type === 'clock_in' ? 'success' : 'info'}>
                          {item.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-dark-300">{formatDate(item.server_timestamp)}</td>
                      <td className="px-6 py-3 text-sm text-dark-300 font-mono">{formatTime(item.server_timestamp)}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-dark-400 max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-dark-500" />
                          <span className="truncate">{item.address || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setSelectedDetail(item)}
                          className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {attendance.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-dark-700/50">
              <p className="text-sm text-dark-400">Halaman {page + 1}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg text-dark-400 hover:bg-dark-800/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={attendance.length < pageSize}
                  className="p-2 rounded-lg text-dark-400 hover:bg-dark-800/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

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
    </PageWrapper>
  )
}
