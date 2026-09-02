import { expandCargoPlaces, type CargoRecord } from './cargoDomain'
import type { OrderEbol } from './orderEbolDomain'

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
  dimensionGroupId: string
  dimensionGroupNumber: number
  pickupVersion: number
  versionLocked: boolean
}

export function createPlaceLabels(record: CargoRecord, orderEbol?: OrderEbol): PlaceLabel[] {
  const route = `${record.originBranch} → ${record.destinationBranch}`
  const versions = new Map<string, { pickupVersion: number; versionLocked: boolean }>()
  for (const id of orderEbol?.pickup.evidence?.placeIds ?? []) versions.set(id, { pickupVersion: 1, versionLocked: Boolean(orderEbol?.pickup.lockedAt) })
  for (const version of orderEbol?.pickupSupplements ?? []) {
    for (const id of version.addedPlaceIds) versions.set(id, { pickupVersion: version.version, versionLocked: version.status === 'locked' })
  }
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
    dimensionGroupId: place.dimensionGroupId,
    dimensionGroupNumber: record.dimensionGroups.findIndex((group) => group.id === place.dimensionGroupId) + 1,
    ...(versions.get(place.placeId) ?? { pickupVersion: orderEbol?.pickup.lockedAt ? 0 : 1, versionLocked: false }),
  }))
}

export function labelVersionName(version: number) {
  return version === 0 ? 'Unassigned draft' : version === 1 ? 'Original Pickup' : `Supplemental v${version}`
}

export function selectPlaceLabels(labels: PlaceLabel[], ids: string[]) {
  const selected = new Set(ids)
  return labels.filter((label) => selected.has(label.placeId))
}

export type LabelPrintOutcome = 'success' | 'error' | 'unavailable'
export interface LabelPrintAttempt {
  id: string
  at: string
  labelIds: string[]
  reprintedIds: string[]
  versions: string[]
  outcome: LabelPrintOutcome
}
export interface LabelPrintState {
  scope: string
  selectedIds: string[]
  history: LabelPrintAttempt[]
}

export function recordLabelPrint(state: LabelPrintState, labels: PlaceLabel[], outcome: LabelPrintOutcome, id: string, at = new Date().toISOString()): LabelPrintState {
  if (!labels.length || state.history.some((attempt) => attempt.id === id)) return state
  const previouslyPrinted = new Set(state.history.filter((attempt) => attempt.outcome === 'success').flatMap((attempt) => attempt.labelIds))
  const ids = Array.from(new Set(labels.map((label) => label.placeId)))
  const attempt: LabelPrintAttempt = { id, at, labelIds: ids, outcome,
    reprintedIds: ids.filter((placeId) => previouslyPrinted.has(placeId)),
    versions: Array.from(new Set(labels.map((label) => labelVersionName(label.pickupVersion)))),
  }
  return { ...state, history: [attempt, ...state.history].slice(0, 20) }
}
