import { calculatePieces, type CargoRecord, type DimensionGroup } from './cargoDomain'

export type InterstateDirection = 'NJ1_CA1' | 'NJ1_CA2' | 'CA1_NJ1' | 'CA2_NJ1'

export interface InterstatePlace {
  key: string
  orderNumber: string
  orderTitle: string
  placeNumber: number
  dimensions: string
  estimatedWeight: number
  volume: number
}

export interface GeneratedInterstateTrip {
  tripId: string
  bolNumber: string
  direction: InterstateDirection
  truck: string
  orderCount: number
  placeCount: number
  loadedWeight: number
  loadedVolume: number
  createdAt: string
}

export type InterstateBolStatus = 'in_transit' | 'closed'

export interface InterstateBolRecord extends GeneratedInterstateTrip {
  status: InterstateBolStatus
  closedAt?: string
}

export const interstateDirections: { id: InterstateDirection; label: string; origin: CargoRecord['originBranch']; destination: CargoRecord['destinationBranch'] }[] = [
  { id: 'NJ1_CA1', label: 'NJ1 → CA1', origin: 'NJ1', destination: 'CA1' },
  { id: 'NJ1_CA2', label: 'NJ1 → CA2', origin: 'NJ1', destination: 'CA2' },
  { id: 'CA1_NJ1', label: 'CA1 → NJ1', origin: 'CA1', destination: 'NJ1' },
  { id: 'CA2_NJ1', label: 'CA2 → NJ1', origin: 'CA2', destination: 'NJ1' },
]

export const interstateTrucks = ['Truck 1 · 26 ft', 'Truck 2 · 26 ft', 'Truck 3 · 16 ft']

export const interstateBolArchive: InterstateBolRecord[] = [
  { tripId: 'NJ1-CA1-260815-004', bolNumber: 'ZB-2026-000183', direction: 'NJ1_CA1', truck: 'Truck 2 · 26 ft', orderCount: 18, placeCount: 64, loadedWeight: 2410, loadedVolume: 1187.4, createdAt: '08/15/2026 · 8:20 PM', status: 'in_transit' },
  { tripId: 'CA1-NJ1-260812-003', bolNumber: 'ZB-2026-000180', direction: 'CA1_NJ1', truck: 'Truck 1 · 26 ft', orderCount: 15, placeCount: 52, loadedWeight: 1985, loadedVolume: 978.2, createdAt: '08/12/2026 · 6:45 PM', status: 'closed', closedAt: '08/15/2026 · 9:10 AM' },
  { tripId: 'NJ1-CA2-260807-002', bolNumber: 'ZB-2026-000176', direction: 'NJ1_CA2', truck: 'Truck 3 · 16 ft', orderCount: 9, placeCount: 31, loadedWeight: 1128, loadedVolume: 542.7, createdAt: '08/07/2026 · 7:30 PM', status: 'closed', closedAt: '08/10/2026 · 11:25 AM' },
  { tripId: 'CA2-NJ1-260731-001', bolNumber: 'ZB-2026-000169', direction: 'CA2_NJ1', truck: 'Truck 2 · 26 ft', orderCount: 21, placeCount: 73, loadedWeight: 2764, loadedVolume: 1328.9, createdAt: '07/31/2026 · 9:05 PM', status: 'closed', closedAt: '08/03/2026 · 8:40 AM' },
]

export function directionLabel(direction: InterstateDirection) {
  return interstateDirections.find((item) => item.id === direction)?.label ?? direction
}

export function generatedTripToBol(trip: GeneratedInterstateTrip): InterstateBolRecord {
  return { ...trip, status: 'in_transit' }
}

export function searchInterstateBols(bols: InterstateBolRecord[], query: string, status?: InterstateBolStatus) {
  const normalizedQuery = query.trim().toLowerCase()
  return bols.filter((bol) => {
    if (status && bol.status !== status) return false
    if (!normalizedQuery) return true
    return [bol.bolNumber, bol.tripId, directionLabel(bol.direction), bol.truck, bol.createdAt]
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  })
}

export function getEligibleRecords(records: CargoRecord[], direction: InterstateDirection) {
  const selected = interstateDirections.find((item) => item.id === direction)
  if (!selected) return []
  return records.filter((record) => (
    record.status === 'pickup_recorded'
    && record.originBranch === selected.origin
    && record.destinationBranch === selected.destination
  ))
}

function groupDimensions(group: DimensionGroup) {
  return `${group.length} × ${group.width} × ${group.height} in`
}

export function expandRecordPlaces(record: CargoRecord): InterstatePlace[] {
  const pieces = Math.max(1, calculatePieces(record.dimensionGroups))
  const estimatedWeight = Math.round((record.totalWeight / pieces) * 10) / 10
  let placeNumber = 0
  return record.dimensionGroups.flatMap((group) => Array.from({ length: group.quantity }, () => {
    placeNumber += 1
    return {
      key: `${record.orderNumber}:${placeNumber}`,
      orderNumber: record.orderNumber,
      orderTitle: record.title,
      placeNumber,
      dimensions: groupDimensions(group),
      estimatedWeight,
      volume: Math.round(((group.length * group.width * group.height) / 1728) * 100) / 100,
    }
  }))
}

export function summarizeLoadedPlaces(places: InterstatePlace[]) {
  return {
    orderCount: new Set(places.map((place) => place.orderNumber)).size,
    placeCount: places.length,
    loadedWeight: Math.round(places.reduce((total, place) => total + place.estimatedWeight, 0)),
    loadedVolume: Math.round(places.reduce((total, place) => total + place.volume, 0) * 100) / 100,
  }
}
