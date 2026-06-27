import { useState, useEffect } from 'react'
import { PageWrapper } from '../../components/layout/AdminLayout'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../utils/dateFormat'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import {
  Plus, Search, Edit3, Trash2, X, Loader2,
  User, Mail, Phone, Briefcase, Building2, Calendar, Upload,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DIVISIONS = ['Human Resources', 'Engineering', 'Marketing', 'Finance', 'Operations', 'Sales', 'IT']

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDivision, setFilterDivision] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', position: '', division: '',
    join_date: new Date().toISOString().slice(0, 10), password: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Gagal memuat data karyawan')
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingEmployee(null)
    setForm({
      name: '', email: '', phone: '', position: '', division: '',
      join_date: new Date().toISOString().slice(0, 10), password: '',
    })
    setAvatarFile(null)
    setShowModal(true)
  }

  function openEditModal(emp) {
    setEditingEmployee(emp)
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || '',
      position: emp.position || '', division: emp.division || '',
      join_date: emp.join_date || '', password: '',
    })
    setAvatarFile(null)
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast.error('Nama dan email wajib diisi')
      return
    }

    setFormLoading(true)
    try {
      let avatarUrl = editingEmployee?.avatar_url || null

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update({
            name: form.name, email: form.email, phone: form.phone,
            position: form.position, division: form.division,
            join_date: form.join_date, avatar_url: avatarUrl,
          })
          .eq('id', editingEmployee.id)

        if (error) throw error
        toast.success('Karyawan berhasil diperbarui')
      } else {
        // Create auth user first
        if (!form.password) {
          toast.error('Password wajib diisi untuk karyawan baru')
          setFormLoading(false)
          return
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })
        if (authError) throw authError

        // Insert employee record
        const { error } = await supabase
          .from('employees')
          .insert({
            auth_id: authData.user.id,
            name: form.name, email: form.email, phone: form.phone,
            position: form.position, division: form.division,
            join_date: form.join_date, avatar_url: avatarUrl,
            role: 'employee',
          })

        if (error) throw error
        toast.success('Karyawan berhasil ditambahkan')
      }

      setShowModal(false)
      fetchEmployees()
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error(error.message || 'Gagal menyimpan data karyawan')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(emp) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', emp.id)

      if (error) throw error
      toast.success('Karyawan berhasil dihapus')
      setShowDeleteConfirm(null)
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Gagal menghapus karyawan')
    }
  }

  const filtered = employees.filter(emp => {
    const matchSearch = !search ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
    const matchDivision = !filterDivision || emp.division === filterDivision
    return matchSearch && matchDivision
  })

  return (
    <PageWrapper title="Kelola Karyawan">
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 
                  text-sm text-dark-100 placeholder:text-dark-500
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
            </div>
            <select
              value={filterDivision}
              onChange={(e) => setFilterDivision(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 
                text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            >
              <option value="">Semua Divisi</option>
              {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 
              text-white text-sm font-medium shadow-lg shadow-primary-500/25
              hover:shadow-primary-500/40 transition-all flex items-center gap-2
              transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>

        {/* Employee Count */}
        <p className="text-sm text-dark-400">
          Menampilkan <span className="text-dark-200 font-medium">{filtered.length}</span> karyawan
        </p>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">{search ? 'Tidak ada karyawan ditemukan' : 'Belum ada data karyawan'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-dark-400 uppercase tracking-wider border-b border-dark-700/50">
                    <th className="px-6 py-3 font-medium">Karyawan</th>
                    <th className="px-6 py-3 font-medium">Jabatan</th>
                    <th className="px-6 py-3 font-medium">Divisi</th>
                    <th className="px-6 py-3 font-medium">No HP</th>
                    <th className="px-6 py-3 font-medium">Tgl Bergabung</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/50">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-dark-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-dark-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                              {emp.name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-dark-100">{emp.name}</p>
                            <p className="text-xs text-dark-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-300">{emp.position || '-'}</td>
                      <td className="px-6 py-4">
                        {emp.division ? (
                          <Badge variant="primary">{emp.division}</Badge>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-dark-300">{emp.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-dark-300">{formatDate(emp.join_date)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={emp.is_active ? 'success' : 'danger'}>
                          {emp.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(emp)}
                            className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Nama Lengkap *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="Nama karyawan"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="email@perusahaan.com"
                    required
                    disabled={!!editingEmployee}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">No HP</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Jabatan</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    value={form.position}
                    onChange={e => setForm({...form, position: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="Software Engineer"
                  />
                </div>
              </div>

              {/* Division */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Divisi</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <select
                    value={form.division}
                    onChange={e => setForm({...form, division: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  >
                    <option value="">Pilih Divisi</option>
                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Tanggal Bergabung</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="date"
                    value={form.join_date}
                    onChange={e => setForm({...form, join_date: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Password (only for new employees) */}
              {!editingEmployee && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-300 mb-1">Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    required
                  />
                </div>
              )}

              {/* Avatar */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-dark-300 mb-1">Foto Profil</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 border-dashed text-sm text-dark-400 cursor-pointer hover:border-primary-500/50 hover:text-primary-400 transition-all">
                    <Upload className="w-4 h-4" />
                    {avatarFile ? avatarFile.name : 'Pilih foto...'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {avatarFile && (
                    <button type="button" onClick={() => setAvatarFile(null)} className="text-dark-500 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingEmployee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Hapus Karyawan"
          size="sm"
        >
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-dark-200 mb-1">Yakin ingin menghapus karyawan ini?</p>
            <p className="text-sm text-dark-400 mb-6">{showDeleteConfirm?.name} — {showDeleteConfirm?.email}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-5 py-2.5 rounded-xl text-sm text-dark-400 hover:bg-dark-800/50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-5 py-2.5 rounded-xl bg-red-500/15 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}
