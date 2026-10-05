export function googleMapsDirectionsUrl(address: string) {
  const destination = address.trim()
  if (!destination) return undefined
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'driving', dir_action: 'navigate' })
  return `https://www.google.com/maps/dir/?${params}`
}
