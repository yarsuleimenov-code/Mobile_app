import { describe, expect, it } from 'vitest'
import { expandCargoPlaces, initialCargoRecords } from './cargoDomain'
import {
  addPickupDraftPlace, createPickupDraft, pickupDraftToRecord,
  recordPickupDraftPlaceEdit, removePickupDraftPlace, updatePickupDraftPlace,
} from './pickupDraftDomain'
import { findPickupDraft, readPickupDrafts, upsertPickupDraft, writePickupDrafts } from './pickupDraftStore'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('Pickup draft lifecycle', () => {
  it('adds, edits and removes places without changing surviving PlaceID values', () => {
    const created = createPickupDraft(initialCargoRecords[0], 'NJ1', 'standard', '2026-09-01T10:00:00.000Z')
    const originalIds = created.places.map((place) => place.placeId)
    const added = addPickupDraftPlace(created, '2026-09-01T10:01:00.000Z')
    const addedId = added.places.at(-1)!.placeId
    const edited = recordPickupDraftPlaceEdit(
      updatePickupDraftPlace(added, addedId, 'weight', 22, '2026-09-01T10:02:00.000Z'),
      addedId,
      '2026-09-01T10:02:30.000Z',
    )
    const removed = removePickupDraftPlace(edited, originalIds[0]!, '2026-09-01T10:03:00.000Z')

    expect(addedId).toBe('ZB-11155599-12')
    expect(removed.places.map((place) => place.placeId)).toEqual([...originalIds.slice(1), addedId])
    expect(removed.history.map((entry) => entry.action)).toEqual([
      'draft_created', 'place_added', 'place_edited', 'place_removed',
    ])
  })

  it('restores the latest versioned draft after reopening', () => {
    const storage = memoryStorage()
    const draft = addPickupDraftPlace(createPickupDraft(initialCargoRecords[0], 'NJ1', 'supplemental'))
    expect(writePickupDrafts(upsertPickupDraft([], draft), storage)).toBe(true)
    expect(findPickupDraft(readPickupDrafts(storage), '11155599', 'supplemental')).toEqual(draft)
  })

  it('builds the current projection while retaining original and added PlaceID values', () => {
    const original = initialCargoRecords[0]
    const originalIds = expandCargoPlaces(original).map((place) => place.placeId)
    let draft = createPickupDraft(original, 'NJ1', 'supplemental')
    draft = addPickupDraftPlace(draft)
    const addedId = draft.places[0]!.placeId
    draft = updatePickupDraftPlace(draft, addedId, 'weight', 18)
    const record = pickupDraftToRecord(draft, original)

    expect(record.placeIds).toEqual([...originalIds, addedId])
    expect(original.placeIds).toBeUndefined()
  })
})
