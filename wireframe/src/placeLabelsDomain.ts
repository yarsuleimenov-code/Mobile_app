import { expandCargoPlaces, type CargoRecord } from './cargoDomain'

export interface PlaceLabel {
  placeId: string
  orderNumber: string
  orderTitle: string
  placeNumber: number
  totalPlaces: number
  route: string
  originBranch: string
  destinationBranch: string
  dimensions: string
}

export function createPlaceLabels(record: CargoRecord): PlaceLabel[] {
  const route = `${record.originBranch} → ${record.destinationBranch}`
  return expandCargoPlaces(record).map((place) => ({
    placeId: place.placeId,
    orderNumber: place.orderNumber,
    orderTitle: record.title,
    placeNumber: place.placeNumber,
    totalPlaces: place.totalPlaces,
    route,
    originBranch: record.originBranch,
    destinationBranch: record.destinationBranch,
    dimensions: place.dimensions,
  }))
}
