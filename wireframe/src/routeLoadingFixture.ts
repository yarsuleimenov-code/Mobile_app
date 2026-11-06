import { createCargoPlaceId } from './cargoDomain'
import type { RouteLoadingPlan } from './routeLoadingDomain'
import type { SpokeOperation } from './spokeDomain'

const warehouseCalendar = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function warehouseWorkDate(daysAhead: number, now = new Date()) {
  const parts = warehouseCalendar.formatToParts(now)
  const part = (type: 'year' | 'month' | 'day') => Number(parts.find((item) => item.type === type)?.value)
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day') + daysAhead)).toISOString().slice(0, 10)
}

// The stop order, operation, ETA and product descriptions follow the sanitized next-day export.
const routeStops: Array<{ operation: SpokeOperation; title: string; products: string; time: string; places?: number; packingPhotoSample?: boolean }> = [
  { operation: 'pickup', title: 'Chimney pot', products: 'Chimney pot', time: '09:07' },
  { operation: 'pickup', title: 'Table', products: '1×Table', time: '10:37' },
  { operation: 'pickup', title: 'Benches and chair', products: '2×Benches, 1×Chair', time: '11:27' },
  { operation: 'dropoff', title: 'Table', products: '1×Table', time: '13:22', places: 2, packingPhotoSample: true },
  { operation: 'pickup', title: 'Table', products: '1×Table', time: '14:17' },
  { operation: 'dropoff', title: 'Chair', products: '1×Chair', time: '15:32', places: 1 },
  { operation: 'dropoff', title: 'Cabinet', products: '1×Cabinet', time: '16:47', places: 1, packingPhotoSample: true },
  { operation: 'pickup', title: 'Desk', products: '1×Desk', time: '17:52' },
  { operation: 'dropoff', title: 'Bed frame', products: '1×Bed frame', time: '19:04', places: 1 },
]

export function nextRouteLoadingPlan(workDate: string): RouteLoadingPlan {
  return {
    routeId: 'nj1-next-day',
    workDate,
    name: 'NJ1 · Next-day route',
    warehouse: 'NJ1',
    vehicle: 'Van 08 · Extended Van',
    stops: routeStops.map(({ operation, title, products, time, places, packingPhotoSample }, index) => {
      const sequence = index + 1
      const externalId = String(76000000 + sequence)
      return { stopId: `next-${sequence}`, sequence, externalId, operation, title, products, address: '', scheduledTime: time,
        loadSource: operation === 'dropoff' ? 'warehouse' : undefined, packingPhotoSample,
        placeIds: places ? Array.from({ length: places }, (_, i) => createCargoPlaceId(externalId, i + 1)) : undefined }
    }),
  }
}
