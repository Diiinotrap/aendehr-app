import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatDateTime(dateString) {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return format(date, 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return format(date, 'dd MMM yyyy', { locale: id })
}

export function formatTime(dateString) {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return format(date, 'HH:mm:ss')
}

export function formatRelative(dateString) {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return formatDistanceToNow(date, { addSuffix: true, locale: id })
}

export function formatDayLabel(dateString) {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  if (isToday(date)) return 'Hari Ini'
  if (isYesterday(date)) return 'Kemarin'
  return format(date, 'EEEE, dd MMM yyyy', { locale: id })
}

export function getMonthYear(dateString) {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
  return format(date, 'MMMM yyyy', { locale: id })
}

export function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return { start: start.toISOString(), end: end.toISOString() }
}
