import type { OrderCargoPlace } from './cargoDomain'

export type PlaceScanResult =
  | { kind: 'found' | 'duplicate'; place: OrderCargoPlace }
  | { kind: 'order'; orderNumber: string; count: number }
  | { kind: 'unknown'; code: string }

export function normalizePlaceCode(rawCode: string) {
  const code = rawCode.trim()
  if (/^https:\/\//i.test(code)) {
    try {
      const url = new URL(code)
      if (url.origin === 'https://script.google.com' && /^\/a\/macros\/zaberman\.com\/s\/[^/]+\/exec$/.test(url.pathname)) {
        const cargo = url.searchParams.getAll('cargo')
        if (cargo.length === 1 && !url.searchParams.has('piece') && /^ZB-\d+-\d+$/i.test(cargo[0])) return cargo[0].toUpperCase()
      }
    } catch { /* Malformed URL follows the regular unknown-code flow. */ }
  }
  return code.toUpperCase()
}

export function findPlaceByCode<T extends { placeId: string }>(places: T[], rawCode: string) {
  const code = normalizePlaceCode(rawCode)
  return places.find((item) => item.placeId.toUpperCase() === code)
}

export function resolvePlaceScan(places: OrderCargoPlace[], rawCode: string, seenIds: string[]): PlaceScanResult {
  const code = normalizePlaceCode(rawCode)
  const place = findPlaceByCode(places, code)
  if (place) return { kind: seenIds.includes(place.placeId) ? 'duplicate' : 'found', place }
  if (/^#?\d+$/.test(code)) {
    const orderNumber = code.replace('#', '')
    const count = places.filter((item) => item.orderNumber === orderNumber).length
    if (count) return { kind: 'order', orderNumber, count }
  }
  return { kind: 'unknown', code }
}
