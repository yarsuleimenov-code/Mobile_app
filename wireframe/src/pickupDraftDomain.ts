import {
  calculateVolume, createCargoPlaceId, expandCargoPlaces,
  type CargoChangeEntry, type CargoRecord, type DimensionGroup, type Warehouse,
} from './cargoDomain'

export type PickupDraftMode = 'standard' | 'supplemental'

export interface PickupDraftPlace {
  placeId: string
  length: number
  width: number
  height: number
  weight: number
}

export interface PickupDraft {
  orderNumber: string
  mode: PickupDraftMode
  title: string
  pickupDate: string
  originBranch: Warehouse
  destinationBranch: Warehouse
  packaging: string
  orderComment: string
  responsible: string
  photoCount: number
  basePlaceIds: string[]
  places: PickupDraftPlace[]
  history: CargoChangeEntry[]
  createdAt: string
  updatedAt: string
}

function toDateInput(value: string | undefined, fallback: string) {
  if (!value) return fallback.slice(0, 10)
  const [month, day, year] = value.split('/')
  return month && day && year ? `${year}-${month}-${day}` : fallback.slice(0, 10)
}

function historyEntry(
  draft: PickupDraft,
  action: CargoChangeEntry['action'],
  detail: string,
  at: string,
): CargoChangeEntry {
  return { id: `${Date.parse(at)}-${draft.history.length + 1}`, at, action, detail }
}

function draftPlaceFromRecord(record: CargoRecord): PickupDraftPlace[] {
  const groups = new Map(record.dimensionGroups.map((group) => [group.id, group]))
  return expandCargoPlaces(record).map((place) => {
    const group = groups.get(place.dimensionGroupId)
    return {
      placeId: place.placeId,
      length: group?.length ?? 0,
      width: group?.width ?? 0,
      height: group?.height ?? 0,
      weight: place.estimatedWeight,
    }
  })
}

export function createPickupDraft(
  record: CargoRecord | undefined,
  branch: Warehouse,
  mode: PickupDraftMode,
  at = new Date().toISOString(),
): PickupDraft {
  const currentPlaces = record ? draftPlaceFromRecord(record) : []
  const draft: PickupDraft = {
    orderNumber: record?.orderNumber ?? '',
    mode,
    title: record?.title ?? '',
    pickupDate: toDateInput(record?.pickupDate, at),
    originBranch: record?.originBranch ?? branch,
    destinationBranch: record?.destinationBranch ?? (branch === 'NJ1' ? 'CA1' : 'NJ1'),
    packaging: record?.packaging ?? 'Customer',
    orderComment: record?.orderComment ?? '',
    responsible: record?.responsible ?? 'John Doe',
    photoCount: mode === 'supplemental' ? 0 : (record?.photoCount ?? 0),
    basePlaceIds: mode === 'supplemental' ? currentPlaces.map((place) => place.placeId) : [],
    places: mode === 'supplemental' ? [] : currentPlaces,
    history: [],
    createdAt: at,
    updatedAt: at,
  }
  return {
    ...draft,
    history: [historyEntry(draft, 'draft_created', mode === 'supplemental' ? 'Supplemental Pickup draft created' : 'Pickup draft created', at)],
  }
}

export function nextPickupPlaceId(draft: PickupDraft) {
  const knownIds = [...draft.basePlaceIds, ...draft.places.map((place) => place.placeId)]
  let highest = 0
  for (const placeId of knownIds) {
    const suffix = Number(placeId.match(/-(\d+)$/)?.[1] ?? 0)
    if (suffix > highest) highest = suffix
  }
  return createCargoPlaceId(draft.orderNumber, highest + 1)
}

export function addPickupDraftPlace(draft: PickupDraft, at = new Date().toISOString()): PickupDraft {
  const placeId = nextPickupPlaceId(draft)
  return {
    ...draft,
    places: [...draft.places, { placeId, length: 0, width: 0, height: 0, weight: 0 }],
    history: [...draft.history, historyEntry(draft, 'place_added', `${placeId} added`, at)],
    updatedAt: at,
  }
}

export function updatePickupDraftPlace(
  draft: PickupDraft,
  placeId: string,
  field: keyof Omit<PickupDraftPlace, 'placeId'>,
  value: number,
  at = new Date().toISOString(),
): PickupDraft {
  return {
    ...draft,
    places: draft.places.map((place) => place.placeId === placeId ? { ...place, [field]: Math.max(0, value) } : place),
    updatedAt: at,
  }
}

export function recordPickupDraftPlaceEdit(draft: PickupDraft, placeId: string, at = new Date().toISOString()): PickupDraft {
  return {
    ...draft,
    history: [...draft.history, historyEntry(draft, 'place_edited', `${placeId} measurements updated`, at)],
    updatedAt: at,
  }
}

export function removePickupDraftPlace(draft: PickupDraft, placeId: string, at = new Date().toISOString()): PickupDraft {
  return {
    ...draft,
    places: draft.places.filter((place) => place.placeId !== placeId),
    history: [...draft.history, historyEntry(draft, 'place_removed', `${placeId} removed from draft`, at)],
    updatedAt: at,
  }
}

function toDimensionGroup(place: PickupDraftPlace): DimensionGroup {
  return {
    id: `draft-${place.placeId}`,
    quantity: 1,
    length: place.length,
    width: place.width,
    height: place.height,
  }
}

export function pickupDraftVolume(draft: PickupDraft) {
  return calculateVolume(draft.places.map(toDimensionGroup))
}

export function pickupDraftWeight(draft: PickupDraft) {
  return Math.round(draft.places.reduce((total, place) => total + place.weight, 0) * 10) / 10
}

export function pickupDraftToRecord(draft: PickupDraft, currentRecord?: CargoRecord): CargoRecord {
  const currentPlaces = currentRecord ? draftPlaceFromRecord(currentRecord) : []
  const basePlaces = draft.mode === 'supplemental'
    ? currentPlaces.filter((place) => draft.basePlaceIds.includes(place.placeId))
    : []
  const allPlaces = [...basePlaces, ...draft.places]
  const [year, month, day] = draft.pickupDate.split('-')
  return {
    orderNumber: draft.orderNumber,
    title: draft.title || currentRecord?.title || '',
    pickupDate: month && day && year ? `${month}/${day}/${year}` : draft.pickupDate,
    originBranch: draft.originBranch,
    destinationBranch: draft.destinationBranch,
    totalWeight: Math.round(allPlaces.reduce((total, place) => total + place.weight, 0) * 10) / 10,
    dimensionGroups: allPlaces.map(toDimensionGroup),
    packaging: draft.packaging,
    orderComment: draft.orderComment,
    responsible: draft.responsible,
    photoCount: draft.mode === 'supplemental' ? (currentRecord?.photoCount ?? 0) + draft.photoCount : draft.photoCount,
    status: 'pickup_recorded',
    placeIds: allPlaces.map((place) => place.placeId),
    changeHistory: [...(currentRecord?.changeHistory ?? []), ...draft.history],
  }
}
