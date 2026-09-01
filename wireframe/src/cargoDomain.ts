export interface DimensionGroup {
  id: string
  quantity: number
  length: number
  width: number
  height: number
}

export interface CargoChangeEntry {
  id: string
  at: string
  action: 'draft_created' | 'place_added' | 'place_edited' | 'place_removed'
  detail: string
}

export type CargoRecordStatus = 'pickup_recorded' | 'dropoff_complete'

export const warehouses = ['NJ1', 'CA1', 'CA2', 'TX1', 'FL1', 'AL1'] as const
export type Warehouse = typeof warehouses[number]

export interface CargoRecord {
  orderNumber: string
  title: string
  pickupDate: string
  originBranch: Warehouse
  destinationBranch: Warehouse
  totalWeight: number
  dimensionGroups: DimensionGroup[]
  packaging: string
  orderComment: string
  responsible: string
  photoCount: number
  status: CargoRecordStatus
  placeIds?: string[]
  changeHistory?: CargoChangeEntry[]
}
export interface OrderCargoPlace {
  placeId: string
  orderNumber: string
  placeNumber: number
  totalPlaces: number
  dimensionGroupId: string
  dimensions: string
  estimatedWeight: number
  weightSource: 'allocated_from_order_total'
  volume: number
  label: string
  currentLocation: string
  status: CargoPlaceStatus
  events: CargoPlaceEvent[]
}

export type CargoPlaceStatus = 'ready_for_loading' | 'loaded' | 'in_transit' | 'delivered'

export interface CargoPlaceEvent {
  id: string
  at: string
  title: string
  detail: string
}


export const defaultDimensionGroups: DimensionGroup[] = [
  { id: 'group-1', quantity: 3, length: 11, width: 22, height: 33 },
  { id: 'group-2', quantity: 7, length: 22, width: 44, height: 66 },
  { id: 'group-3', quantity: 1, length: 11, width: 11, height: 11 },
]

export function calculatePieces(groups: DimensionGroup[]) {
  return groups.reduce((total, group) => total + Math.max(0, group.quantity || 0), 0)
}

export function calculateVolume(groups: DimensionGroup[]) {
  const cubicInches = groups.reduce((total, group) => (
    total + Math.max(0, group.quantity || 0)
      * Math.max(0, group.length || 0)
      * Math.max(0, group.width || 0)
      * Math.max(0, group.height || 0)
  ), 0)
  return Math.round((cubicInches / 1728) * 100) / 100
}

export function normalizeOrderNumber(value: string) {
  return value.replace(/[^0-9]/g, '')
}
export function createCargoPlaceId(orderNumber: string, placeNumber: number) {
  return `ZB-${normalizeOrderNumber(orderNumber)}-${String(placeNumber).padStart(2, '0')}`
}

export function expandCargoPlaces(record: CargoRecord): OrderCargoPlace[] {
  const totalPlaces = Math.max(1, calculatePieces(record.dimensionGroups))
  const estimatedWeight = Math.round((record.totalWeight / totalPlaces) * 10) / 10
  let placeNumber = 0

  return record.dimensionGroups.flatMap((group) => Array.from({ length: Math.max(0, group.quantity) }, () => {
    placeNumber += 1
    return {
      placeId: record.placeIds?.[placeNumber - 1] ?? createCargoPlaceId(record.orderNumber, placeNumber),
      orderNumber: record.orderNumber,
      placeNumber,
      totalPlaces,
      dimensionGroupId: group.id,
      dimensions: `${group.length} × ${group.width} × ${group.height} in`,
      estimatedWeight,
      weightSource: 'allocated_from_order_total',
      volume: Math.round(((group.length * group.width * group.height) / 1728) * 100) / 100,
      label: `Place ${placeNumber}/${totalPlaces} · Code 128`,
      currentLocation: record.status === 'dropoff_complete'
        ? `${record.destinationBranch} · Delivered`
        : `${record.originBranch} · Pickup staging`,
      status: record.status === 'dropoff_complete' ? 'delivered' : 'ready_for_loading',
      events: [
        { id: 'place-id-assigned', at: record.pickupDate, title: 'Place ID assigned', detail: `Created from Order #${record.orderNumber}` },
        { id: 'pickup-recorded', at: record.pickupDate, title: 'Pickup recorded', detail: `${group.length} × ${group.width} × ${group.height} in · ${estimatedWeight} lb allocated` },
        ...(record.status === 'dropoff_complete'
          ? [{ id: 'delivery-completed', at: 'Current record', title: 'Delivery completed', detail: `Received at ${record.destinationBranch}` }]
          : []),
      ],
    }
  }))
}


export const initialCargoRecords: CargoRecord[] = [
  {
    orderNumber: '11155599',
    title: 'Wooden credenza',
    pickupDate: '07/26/2026',
    originBranch: 'NJ1',
    destinationBranch: 'CA1',
    totalWeight: 123,
    dimensionGroups: defaultDimensionGroups,
    packaging: 'Customer',
    orderComment: 'commentSize\norderComment',
    responsible: 'John Doe',
    photoCount: 4,
    status: 'pickup_recorded',
  },
  {
    orderNumber: '11112345', title: 'Bookcase set', pickupDate: '07/25/2026', originBranch: 'NJ1', destinationBranch: 'NJ1', totalWeight: 95,
    dimensionGroups: [{ id: 'r2-1', quantity: 8, length: 18, width: 24, height: 30 }],
    packaging: 'Zaberman', orderComment: '', responsible: 'Maria Lopez', photoCount: 5,
    status: 'dropoff_complete',
  },
  {
    orderNumber: '11098765', title: 'Crate-Mitchell', pickupDate: '07/24/2026', originBranch: 'NJ1', destinationBranch: 'CA1', totalWeight: 160,
    dimensionGroups: [{ id: 'r3-1', quantity: 14, length: 16, width: 20, height: 28 }],
    packaging: 'Customer', orderComment: '', responsible: 'Daniel Kim', photoCount: 4,
    status: 'pickup_recorded',
  },
  {
    orderNumber: '11076543', title: 'Teak desk', pickupDate: '07/22/2026', originBranch: 'NJ1', destinationBranch: 'CA1', totalWeight: 110,
    dimensionGroups: [{ id: 'r4-1', quantity: 10, length: 18, width: 24, height: 32 }],
    packaging: 'Zaberman', orderComment: '', responsible: 'John Doe', photoCount: 4,
    status: 'pickup_recorded',
  },
  {
    orderNumber: '11065432', title: 'Marble console', pickupDate: '07/21/2026', originBranch: 'NJ1', destinationBranch: 'CA2', totalWeight: 205,
    dimensionGroups: [{ id: 'r5-1', quantity: 3, length: 52, width: 18, height: 34 }],
    packaging: 'Zaberman', orderComment: '', responsible: 'Maria Lopez', photoCount: 5,
    status: 'pickup_recorded',
  },
]
