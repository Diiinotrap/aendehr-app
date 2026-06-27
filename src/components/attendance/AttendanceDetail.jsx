import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { formatDateTime, formatTime } from '../../utils/dateFormat'
import Badge from '../ui/Badge'
import {
  Clock, MapPin, Navigation, FileText,
  CalendarDays, Timer,
} from 'lucide-react'

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function AttendanceDetail({ data }) {
  const hasLocation = data.latitude && data.longitude
  const position = hasLocation ? [data.latitude, data.longitude] : [-6.2088, 106.8456]

  return (
    <div className="space-y-5">
      {/* Split View: Map + Selfie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden border border-dark-700/50 h-[300px]">
          {hasLocation ? (
            <MapContainer
              center={position}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  <strong>{data.employees?.name}</strong><br />
                  {data.type === 'clock_in' ? 'Clock In' : 'Clock Out'}<br />
                  {formatTime(data.server_timestamp)}
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-dark-800/50">
              <div className="text-center text-dark-500">
                <MapPin className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Lokasi tidak tersedia</p>
              </div>
            </div>
          )}
        </div>

        {/* Selfie Photo */}
        <div className="rounded-2xl overflow-hidden border border-dark-700/50 h-[300px] bg-dark-800/50">
          {data.selfie_url ? (
            <img
              src={data.selfie_url}
              alt="Selfie"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-dark-500">
                <div className="w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">📷</span>
                </div>
                <p className="text-sm">Foto tidak tersedia</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type & Time */}
        <div className="glass-light rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Timer className="w-4 h-4 text-primary-400" />
            <span className="text-dark-400">Tipe Absensi:</span>
            <Badge variant={data.type === 'clock_in' ? 'success' : 'info'} size="md">
              {data.type === 'clock_in' ? 'Clock In' : 'Clock Out'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary-400" />
            <span className="text-dark-400">Waktu:</span>
            <span className="text-dark-100 font-medium">{formatDateTime(data.server_timestamp)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-primary-400" />
            <span className="text-dark-400">Shift:</span>
            <span className="text-dark-200">08:00 - 17:00 (Default)</span>
          </div>
        </div>

        {/* Location */}
        <div className="glass-light rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-accent-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-dark-400">Alamat:</span>
              <p className="text-dark-200 text-sm mt-0.5">{data.address || 'Tidak tersedia'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-accent-400" />
            <span className="text-dark-400">Koordinat:</span>
            <span className="text-dark-200 font-mono text-xs">
              {hasLocation ? `${data.latitude}, ${data.longitude}` : 'Tidak tersedia'}
            </span>
          </div>

          {data.notes && (
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-dark-400">Catatan:</span>
                <p className="text-dark-200 text-sm mt-0.5">{data.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
