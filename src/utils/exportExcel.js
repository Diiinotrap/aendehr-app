import * as XLSX from 'xlsx'
import { formatDateTime } from './dateFormat'

export function exportAttendanceToExcel(data, filename = 'laporan-absensi') {
  const rows = data.map((item, index) => ({
    'No': index + 1,
    'Nama Karyawan': item.employees?.name || '-',
    'Divisi': item.employees?.division || '-',
    'Jabatan': item.employees?.position || '-',
    'Tipe': item.type === 'clock_in' ? 'Clock In' : 'Clock Out',
    'Waktu': formatDateTime(item.server_timestamp),
    'Alamat': item.address || '-',
    'Latitude': item.latitude || '-',
    'Longitude': item.longitude || '-',
    'Catatan': item.notes || '-',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // No
    { wch: 25 },  // Nama
    { wch: 15 },  // Divisi
    { wch: 20 },  // Jabatan
    { wch: 12 },  // Tipe
    { wch: 22 },  // Waktu
    { wch: 40 },  // Alamat
    { wch: 15 },  // Lat
    { wch: 15 },  // Lng
    { wch: 20 },  // Catatan
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi')

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `${filename}-${today}.xlsx`)
}
