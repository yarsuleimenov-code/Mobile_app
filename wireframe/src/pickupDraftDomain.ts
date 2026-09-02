import {
  calculateVolume, createCargoPlaceId, expandCargoPlaces,
  type CargoChangeEntry, type CargoRecord, type DimensionGroup, type Warehouse,
} from './cargoDomain'
import { dimensionText, measured } from './measurementDomain'
import { evidencePhotos, type EvidencePhoto } from './photoEvidenceDomain'

export type PickupDraftMode = 'standard' | 'supplemental'

export interface PickupDraftPlace {
  placeId: string
  dimensionGroupId?: string
  length: number | null
  width: number | null
  height: number | null
  weight: number | null
  unknownReason?: string
  notMeasurable?: boolean
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
  photos?: EvidencePhoto[]
  basePlaceIds: string[]
  basePhotoIds?: string[]
  places: PickupDraftPlace[]
  lastPlaceSequence?: number
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
      dimensionGroupId: place.dimensionGroupId,
      length: measured(group?.length) ? group!.length : null,
      width: measured(group?.width) ? group!.width : null,
      height: measured(group?.height) ? group!.height : null,
      unknownReason: group?.unknownReason,
      notMeasurable: group?.notMeasurable,
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
    photos: mode === 'supplemental' || !record ? [] : evidencePhotos(record, record.orderNumber, 'pickup'),
    basePlaceIds: mode === 'supplemental' ? currentPlaces.map((place) => place.placeId) : [],
    basePhotoIds: mode === 'supplemental' && record ? evidencePhotos(record, record.orderNumber, 'pickup').map((photo) => photo.id) : [],
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
  let highest = draft.lastPlaceSequence ?? 0
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
    places: [...draft.places, { placeId, length: null, width: null, height: null, weight: null }],
    lastPlaceSequence: Number(placeId.match(/-(\d+)$/)?.[1]),
    history: [...draft.history, historyEntry(draft, 'place_added', `${placeId} added`, at)],
    updatedAt: at,
  }
}

export function updatePickupDraftPlace(
  draft: PickupDraft,
  placeId: string,
  field: 'length' | 'width' | 'height' | 'weight',
  value: number,
  at = new Date().toISOString(),
): PickupDraft {
  return {
    ...draft,
    places: draft.places.map((place) => place.placeId === placeId ? { ...place, [field]: measured(value) ? value : null } : place),
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

export interface PickupDraftGroup extends DimensionGroup {
  weight: number | null
  placeIds: string[]
}

// Groups are derived from places, preserving legacy drafts and their PlaceID order.
export function pickupDraftGroups(draft: Pick<PickupDraft, 'places'>): PickupDraftGroup[] {
  const groups: PickupDraftGroup[] = []
  for (const original of draft.places) {
    const place = { ...original, length: measured(original.length) ? original.length : null,
      width: measured(original.width) ? original.width : null, height: measured(original.height) ? original.height : null,
      weight: measured(original.weight) ? original.weight : null }
    const previous = groups.at(-1)
    const id = place.dimensionGroupId ?? previous?.id ?? `group-${place.placeId}`
    if (previous && previous.id === id && previous.length === place.length
      && previous.width === place.width && previous.height === place.height && previous.weight === place.weight
      && previous.unknownReason === place.unknownReason && previous.notMeasurable === place.notMeasurable) {
      previous.quantity += 1
      previous.placeIds.push(place.placeId)
    } else {
      groups.push({ id: place.dimensionGroupId ?? `group-${place.placeId}`, quantity: 1,
        length: place.length, width: place.width, height: place.height, weight: place.weight,
        unknownReason: place.unknownReason, notMeasurable: place.notMeasurable, placeIds: [place.placeId] })
    }
  }
  return groups
}

export function addPickupDraftGroup(draft: PickupDraft, at = new Date().toISOString()): PickupDraft {
  const added = addPickupDraftPlace(draft, at)
  const place = added.places.at(-1)!
  return { ...added, places: added.places.map((item) => item === place
    ? { ...item, dimensionGroupId: `group-${place.placeId}` } : item),
    history: [...draft.history, historyEntry(draft, 'place_added', `Dimension group added · ${place.placeId}`, at)] }
}

export function updatePickupDraftGroup(
  draft: PickupDraft, groupId: string, field: 'quantity' | 'length' | 'width' | 'height' | 'weight',
  value: number, at = new Date().toISOString(),
): PickupDraft {
  const group = pickupDraftGroups(draft).find((item) => item.id === groupId)
  if (!group || !Number.isFinite(value)) return draft
  const ids = new Set(group.placeIds)
  if (field !== 'quantity') return { ...draft, updatedAt: at,
    places: draft.places.map((place) => ids.has(place.placeId)
      ? { ...place, dimensionGroupId: groupId, [field]: measured(value) ? value : null } : place) }
  const quantity = Math.min(999, Math.max(1, Math.floor(value)))
  const removedIds = new Set(group.placeIds.slice(quantity))
  let next = { ...draft, updatedAt: at, places: draft.places.filter((place) => !removedIds.has(place.placeId)) }
  for (let index = group.quantity; index < quantity; index += 1) {
    const placeId = nextPickupPlaceId(next)
    const insertionIndex = next.places.map((place) => ids.has(place.placeId)).lastIndexOf(true) + 1
    next.places.splice(insertionIndex, 0, { placeId, dimensionGroupId: groupId,
      length: group.length, width: group.width, height: group.height, weight: group.weight,
      unknownReason: group.unknownReason, notMeasurable: group.notMeasurable })
    ids.add(placeId)
    next = { ...next, lastPlaceSequence: Number(placeId.match(/-(\d+)$/)?.[1]) }
  }
  next.lastPlaceSequence = Math.max(next.lastPlaceSequence ?? 0,
    ...draft.places.map((place) => Number(place.placeId.match(/-(\d+)$/)?.[1] ?? 0)))
  return next
}

export function updatePickupMeasurementNote(draft: PickupDraft, groupId: string, edit: { unknownReason?: string; notMeasurable?: boolean }): PickupDraft {
  const group = pickupDraftGroups(draft).find((item) => item.id === groupId)
  if (!group) return draft
  const ids = new Set(group.placeIds)
  const at = new Date().toISOString()
  return { ...draft, updatedAt: at, places: draft.places.map((place) => ids.has(place.placeId) ? { ...place, ...edit } : place),
    history: edit.notMeasurable === undefined ? draft.history : [...draft.history, historyEntry(draft, 'place_edited',
      `Dimension group · ${edit.notMeasurable ? 'Marked not measurable' : 'Measurements enabled'}`, at)] }
}

export function recordPickupDraftGroupEdit(draft: PickupDraft, groupId: string, at = new Date().toISOString()): PickupDraft {
  const group = pickupDraftGroups(draft).find((item) => item.id === groupId)
  if (!group) return draft
  return { ...draft, updatedAt: at, history: [...draft.history, historyEntry(draft, 'place_edited',
    `Dimension group updated · ${group.quantity} pcs · ${dimensionText(group)} · ${group.weight === null ? 'Weight not measured' : `${group.weight} lb/place`}${group.unknownReason ? ` · ${group.unknownReason}` : ''}`, at)] }
}

export function removePickupDraftGroup(draft: PickupDraft, groupId: string, at = new Date().toISOString()): PickupDraft {
  const group = pickupDraftGroups(draft).find((item) => item.id === groupId)
  if (!group) return draft
  const ids = new Set(group.placeIds)
  return { ...draft, updatedAt: at, places: draft.places.filter((place) => !ids.has(place.placeId)),
    lastPlaceSequence: Math.max(draft.lastPlaceSequence ?? 0,
      ...draft.places.map((place) => Number(place.placeId.match(/-(\d+)$/)?.[1] ?? 0))),
    history: [...draft.history, historyEntry(draft, 'place_removed', `Dimension group removed · ${group.quantity} places`, at)] }
}

export function pickupDraftVolume(draft: PickupDraft) {
  return calculateVolume(pickupDraftGroups(draft))
}

export function pickupDraftWeight(draft: PickupDraft) {
  return Math.round(draft.places.reduce((total, place) => total + (place.weight ?? 0), 0) * 10) / 10
}

export function pickupDraftToRecord(draft: PickupDraft, currentRecord?: CargoRecord): CargoRecord {
  const currentPlaces = currentRecord ? draftPlaceFromRecord(currentRecord) : []
  const basePlaces = draft.mode === 'supplemental'
    ? currentPlaces.filter((place) => draft.basePlaceIds.includes(place.placeId))
    : []
  const allPlaces = [...basePlaces, ...draft.places]
  const [year, month, day] = draft.pickupDate.split('-')
  const draftPhotos = evidencePhotos(draft, draft.orderNumber, 'pickup', draft.createdAt)
  const draftPhotoIds = new Set(draftPhotos.map((photo) => photo.id))
  const basePhotoIds = draft.basePhotoIds ? new Set(draft.basePhotoIds) : undefined
  const basePhotos = draft.mode === 'supplemental' && currentRecord
    ? evidencePhotos(currentRecord, draft.orderNumber, 'pickup').filter((photo) => basePhotoIds ? basePhotoIds.has(photo.id) : !draftPhotoIds.has(photo.id)) : []
  const photos = [...basePhotos, ...draftPhotos]
  return {
    orderNumber: draft.orderNumber,
    title: draft.title || currentRecord?.title || '',
    pickupDate: month && day && year ? `${month}/${day}/${year}` : draft.pickupDate,
    originBranch: draft.originBranch,
    destinationBranch: draft.destinationBranch,
    totalWeight: Math.round(allPlaces.reduce((total, place) => total + (place.weight ?? 0), 0) * 10) / 10,
    dimensionGroups: pickupDraftGroups({ places: allPlaces }).map(({ placeIds: _ids, ...group }) => group),
    packaging: draft.packaging,
    orderComment: draft.orderComment,
    responsible: draft.responsible,
    photoCount: photos.length,
    photos,
    status: 'pickup_recorded',
    placeIds: allPlaces.map((place) => place.placeId),
    changeHistory: [...(currentRecord?.changeHistory ?? []), ...draft.history],
  }
}
