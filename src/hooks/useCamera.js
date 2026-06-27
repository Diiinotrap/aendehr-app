import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsActive(true)
    } catch (err) {
      let message = 'Gagal mengakses kamera'
      if (err.name === 'NotAllowedError') {
        message = 'Izin kamera ditolak. Mohon izinkan akses kamera.'
      } else if (err.name === 'NotFoundError') {
        message = 'Kamera tidak ditemukan'
      }
      setError(message)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    // Mirror the image for selfie
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setPhoto({ blob, url })
        stopCamera()
        resolve({ blob, url })
      }, 'image/jpeg', 0.8)
    })
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    if (photo?.url) {
      URL.revokeObjectURL(photo.url)
    }
    setPhoto(null)
    startCamera()
  }, [photo, startCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (photo?.url) {
        URL.revokeObjectURL(photo.url)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoRef,
    canvasRef,
    isActive,
    photo,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
  }
}
