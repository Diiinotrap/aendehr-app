/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap).
 * Free, no API key required.
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'id',
          'User-Agent': 'HRIS-App/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()
    return data.display_name || `${latitude}, ${longitude}`
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return `${latitude}, ${longitude}`
  }
}
