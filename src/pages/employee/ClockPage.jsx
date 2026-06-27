import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useCamera } from '../../hooks/useCamera'
import { reverseGeocode } from '../../utils/reverseGeocode'
import { formatTime, formatDateTime, getTodayRange } from '../../utils/dateFormat'
import Header from '../../components/layout/Header'
import Badge from '../../components/ui/Badge'
import {
  Camera, MapPin, Clock, CheckCircle2, XCircle,
  Loader2, RefreshCw, LogIn, LogOut, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClockPage() {
  const { employee } = useAuth()
  const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation()
  const { videoRef, canvasRef, isActive, photo, error: camError, startCamera, capturePhoto, retakePhoto } = useCamera()

  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [todayStatus, setTodayStatus] = useState({ clockIn: null, clockOut: null })
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch today's attendance status
  useEffect(() => {
    if (employee) fetchTodayStatus()
  }, [employee])

  // Get location and start camera on mount
  useEffect(() => {
    getLocation()
    startCamera()
  }, [])

  // Reverse geocode when location changes
  useEffect(() => {
    if (location) {
      reverseGeocode(location.latitude, location.longitude).then(setAddress)
    }
  }, [location])

  async function fetchTodayStatus() {
    const { start, end } = getTodayRange()
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('server_timestamp', start)
      .lte('server_timestamp', end)
      .order('server_timestamp', { ascending: true })

    const clockIn = data?.find(d => d.type === 'clock_in')
    const clockOut = data?.find(d => d.type === 'clock_out')
    setTodayStatus({ clockIn, clockOut })
  }

  async function handleSubmit(type) {
    if (!photo) {
      toast.error('Silakan ambil foto selfie terlebih dahulu')
      return
    }
    if (!location) {
      toast.error('Lokasi GPS belum tersedia. Mohon izinkan akses lokasi.')
      return
    }

    setSubmitting(true)
    try {
      // Upload selfie to Supabase Storage
      const fileName = `${employee.id}/${type}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, photo.blob, { contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attendance-photos')
        .getPublicUrl(fileName)

      // Insert attendance record
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          type,
          selfie_url: publicUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          address: address || null,
          notes: notes || null,
        })

      if (insertError) throw insertError

      toast.success(type === 'clock_in' ? 'Clock In berhasil! ✅' : 'Clock Out berhasil! 👋')
      fetchTodayStatus()
    } catch (error) {
      console.error('Error submitting attendance:', error)
      toast.error('Gagal menyimpan data absensi')
    } finally {
      setSubmitting(false)
    }
  }

  const canClockIn = !todayStatus.clockIn
  const canClockOut = todayStatus.clockIn && !todayStatus.clockOut

  return (
    <>
      <Header title="Absensi" />
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Live Clock */}
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-dark-400 text-sm mb-1">Waktu Sekarang</p>
            <p className="text-5xl font-bold gradient-text tracking-wider font-mono">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-dark-400 text-sm mt-2">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Today's Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`glass rounded-2xl p-4 flex items-center gap-4 ${todayStatus.clockIn ? 'border border-emerald-500/20' : ''}`}>
              <div className={`p-3 rounded-xl ${todayStatus.clockIn ? 'bg-emerald-500/15' : 'bg-dark-800/50'}`}>
                <LogIn className={`w-5 h-5 ${todayStatus.clockIn ? 'text-emerald-400' : 'text-dark-500'}`} />
              </div>
              <div>
                <p className="text-sm text-dark-400">Clock In</p>
                {todayStatus.clockIn ? (
                  <p className="text-lg font-semibold text-emerald-400 font-mono">
                    {formatTime(todayStatus.clockIn.server_timestamp)}
                  </p>
                ) : (
                  <p className="text-sm text-dark-500">Belum</p>
                )}
              </div>
            </div>
            <div className={`glass rounded-2xl p-4 flex items-center gap-4 ${todayStatus.clockOut ? 'border border-sky-500/20' : ''}`}>
              <div className={`p-3 rounded-xl ${todayStatus.clockOut ? 'bg-sky-500/15' : 'bg-dark-800/50'}`}>
                <LogOut className={`w-5 h-5 ${todayStatus.clockOut ? 'text-sky-400' : 'text-dark-500'}`} />
              </div>
              <div>
                <p className="text-sm text-dark-400">Clock Out</p>
                {todayStatus.clockOut ? (
                  <p className="text-lg font-semibold text-sky-400 font-mono">
                    {formatTime(todayStatus.clockOut.server_timestamp)}
                  </p>
                ) : (
                  <p className="text-sm text-dark-500">Belum</p>
                )}
              </div>
            </div>
          </div>

          {/* Camera & Location */}
          {(!todayStatus.clockIn || !todayStatus.clockOut) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Camera */}
              <div className="glass rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary-400" />
                  Foto Selfie
                </h3>

                <div className="relative rounded-xl overflow-hidden bg-dark-800 aspect-[4/3]">
                  {camError ? (
                    <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                      <div>
                        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-red-300">{camError}</p>
                        <button onClick={startCamera} className="mt-2 text-sm text-primary-400 hover:underline">
                          Coba Lagi
                        </button>
                      </div>
                    </div>
                  ) : photo ? (
                    <img src={photo.url} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover camera-mirror"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {photo ? (
                    <button
                      onClick={retakePhoto}
                      className="flex-1 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-300 
                        hover:bg-dark-700/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Foto Ulang
                    </button>
                  ) : (
                    <button
                      onClick={capturePhoto}
                      disabled={!isActive}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium
                        shadow-lg shadow-primary-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    >
                      <Camera className="w-4 h-4" /> Ambil Foto
                    </button>
                  )}
                </div>
              </div>

              {/* Location & Submit */}
              <div className="space-y-4">
                {/* GPS Status */}
                <div className="glass rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent-400" />
                    Lokasi GPS
                  </h3>

                  {geoLoading ? (
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mendapatkan lokasi...
                    </div>
                  ) : geoError ? (
                    <div className="flex items-start gap-2 text-sm text-red-300">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p>{geoError}</p>
                        <button onClick={getLocation} className="text-primary-400 hover:underline mt-1">Coba Lagi</button>
                      </div>
                    </div>
                  ) : location ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-300">Lokasi ditemukan</span>
                      </div>
                      <p className="text-xs text-dark-400 font-mono">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                      {address && (
                        <p className="text-sm text-dark-300 bg-dark-800/50 rounded-lg p-2.5">{address}</p>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Notes */}
                <div className="glass rounded-2xl p-5">
                  <label className="block text-sm font-semibold text-dark-200 mb-2">
                    Catatan (opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-sm text-dark-100 
                      placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {canClockIn && (
                    <button
                      onClick={() => handleSubmit('clock_in')}
                      disabled={submitting || !photo || !location}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 
                        text-white text-lg font-bold shadow-lg shadow-emerald-500/25
                        hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all transform hover:scale-[1.01] active:scale-[0.99]
                        flex items-center justify-center gap-3"
                    >
                      {submitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <LogIn className="w-6 h-6" />
                      )}
                      {submitting ? 'Memproses...' : 'CLOCK IN'}
                    </button>
                  )}

                  {canClockOut && (
                    <button
                      onClick={() => handleSubmit('clock_out')}
                      disabled={submitting || !photo || !location}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 
                        text-white text-lg font-bold shadow-lg shadow-sky-500/25
                        hover:shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all transform hover:scale-[1.01] active:scale-[0.99]
                        flex items-center justify-center gap-3"
                    >
                      {submitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <LogOut className="w-6 h-6" />
                      )}
                      {submitting ? 'Memproses...' : 'CLOCK OUT'}
                    </button>
                  )}

                  {todayStatus.clockIn && todayStatus.clockOut && (
                    <div className="glass rounded-2xl p-6 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-lg font-semibold text-dark-100">Absensi Hari Ini Selesai ✅</p>
                      <p className="text-sm text-dark-400 mt-1">
                        Clock In: {formatTime(todayStatus.clockIn.server_timestamp)} — Clock Out: {formatTime(todayStatus.clockOut.server_timestamp)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
