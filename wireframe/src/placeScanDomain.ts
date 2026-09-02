import type { OrderCargoPlace } from './cargoDomain'

export type PlaceScanResult =
  | { kind: 'found' | 'duplicate'; place: OrderCargoPlace }
  | { kind: 'order'; orderNumber: string; count: number }
  | { kind: 'unknown'; code: string }

export function resolvePlaceScan(places: OrderCargoPlace[], rawCode: string, seenIds: string[]): PlaceScanResult {
  const code = rawCode.trim().toUpperCase()
  const place = places.find((item) => item.placeId.toUpperCase() === code)
  if (place) return { kind: seenIds.includes(place.placeId) ? 'duplicate' : 'found', place }
  if (/^#?\d+$/.test(code)) {
    const orderNumber = code.replace('#', '')
    const count = places.filter((item) => item.orderNumber === orderNumber).length
    if (count) return { kind: 'order', orderNumber, count }
  }
  return { kind: 'unknown', code }
}
