import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda')
      return Promise.reject(new Error('Geolocation not supported'))
    }

    setLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setLocation(loc)
          setLoading(false)
          resolve(loc)
        },
        (err) => {
          let message = 'Gagal mendapatkan lokasi'
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = 'Izin lokasi ditolak. Mohon aktifkan GPS dan izinkan akses lokasi.'
              break
            case err.POSITION_UNAVAILABLE:
              message = 'Informasi lokasi tidak tersedia'
              break
            case err.TIMEOUT:
              message = 'Permintaan lokasi timeout'
              break
          }
          setError(message)
          setLoading(false)
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  return { location, error, loading, getLocation }
}
