import { describe, expect, it } from 'vitest'
import { calculatePieces, expandCargoPlaces, initialCargoRecords } from './cargoDomain'
import { findPickupDemoRecord } from './pickupDemoData'
import { mockTodaySpokeRoute } from './spokeDomain'
import {
  addPickupDraftGroup, createPickupDraft, pickupDraftGroups, pickupDraftToRecord, pickupDraftVolume,
  pickupDraftWeight, recordPickupDraftGroupEdit, removePickupDraftGroup, updatePickupDraftGroup,
} from './pickupDraftDomain'
import { readPickupDrafts, writePickupDrafts } from './pickupDraftStore'
import { lockPickupEbol, lockSupplementalPickup, prepareSupplementalPickup, syncPickupOrderEbolDraft } from './orderEbolDomain'

describe('Pickup dimension groups and demo orders', () => {
  it('supplies every route Pickup with complete, distinct demo data; Dropoffs already have records', () => {
    for (const task of mockTodaySpokeRoute.tasks) {
      const record = task.operation === 'pickup' ? findPickupDemoRecord(task.externalId)
        : initialCargoRecords.find((item) => item.orderNumber === task.externalId)
      expect(record?.title).toBe(task.title)
      expect(record?.totalWeight).toBeGreaterThan(0)
      expect(record?.photoCount).toBeGreaterThan(0)
      expect(record?.dimensionGroups.every((group) => group.quantity > 0 && group.length > 0 && group.width > 0 && group.height > 0)).toBe(true)
      if (task.operation === 'pickup') {
        expect(record?.orderComment).not.toBe('')
        expect(record?.pickupDate).toBe(mockTodaySpokeRoute.workDate)
        expect(initialCargoRecords.some((item) => item.orderNumber === task.externalId)).toBe(false)
      }
    }
    expect(findPickupDemoRecord('999')).toBeUndefined()
  })

  it('calculates group quantity × volume and weight; keeps groups and weights on review and reopen', () => {
    const record = findPickupDemoRecord('23343775')!
    const draft = createPickupDraft(record, 'NJ1', 'standard')
    expect(pickupDraftGroups(draft)).toHaveLength(1)
    expect(draft.places).toHaveLength(3)
    expect(pickupDraftVolume(draft)).toBe(36)
    expect(pickupDraftWeight(draft)).toBe(54)
    const mixed = createPickupDraft(findPickupDemoRecord('23343778'), 'NJ1', 'standard')
    const saved = pickupDraftToRecord(mixed)
    expect(saved.dimensionGroups.map((group) => group.quantity)).toEqual([1, 2])
    expect(saved.totalWeight).toBe(190)
    expect(expandCargoPlaces(saved).map((place) => place.estimatedWeight)).toEqual([140, 25, 25])
    expect(createPickupDraft(saved, 'NJ1', 'standard').places).toEqual(mixed.places)
  })

  it('updates all places in a group and resizes without changing other groups or recycling removed labels', () => {
    let draft = createPickupDraft(findPickupDemoRecord('23343778'), 'NJ1', 'standard')
    const firstId = draft.places[0].placeId
    const untouched = structuredClone(draft.places.slice(1))
    draft = updatePickupDraftGroup(draft, 'sofa', 'quantity', 3)
    expect(draft.places.map((place) => place.placeId)).toEqual([firstId, 'ZB-23343778-04', 'ZB-23343778-05', ...untouched.map((place) => place.placeId)])
    draft = updatePickupDraftGroup(draft, 'sofa', 'length', 90)
    expect(draft.places.slice(0, 3).every((place) => place.length === 90)).toBe(true)
    expect(draft.places.slice(3)).toEqual(untouched)
    draft = updatePickupDraftGroup(draft, 'sofa', 'quantity', 1)
    draft = updatePickupDraftGroup(draft, 'sofa', 'quantity', 2)
    expect(draft.places[1].placeId).toBe('ZB-23343778-06')
    draft = recordPickupDraftGroupEdit(draft, 'sofa')
    draft = removePickupDraftGroup(draft, 'sofa')
    expect(draft.places).toEqual(untouched)
    draft = addPickupDraftGroup(draft)
    expect(draft.places.at(-1)?.placeId).toBe('ZB-23343778-07')
    expect(draft.history.map((entry) => entry.action)).toEqual(['draft_created', 'place_edited', 'place_removed', 'place_added'])
    expect(calculatePieces(pickupDraftToRecord(draft).dimensionGroups)).toBe(3)
  })

  it('restores existing v1 drafts without losing IDs, measurements or history', () => {
    const values = new Map<string, string>()
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }
    const created = createPickupDraft(findPickupDemoRecord('23343775'), 'NJ1', 'standard')
    const legacy = { ...created, places: created.places.map(({ dimensionGroupId: _id, ...place }) => place) }
    writePickupDrafts([legacy], storage)
    const restored = readPickupDrafts(storage)[0]
    expect(restored).toEqual(legacy)
    expect(pickupDraftGroups(restored)).toHaveLength(1)
    const groupId = pickupDraftGroups(restored)[0].id
    const edited = recordPickupDraftGroupEdit(updatePickupDraftGroup(restored, groupId, 'width', 26), groupId)
    writePickupDrafts([edited], storage)
    expect(readPickupDrafts(storage)[0]).toEqual(edited)
    expect(edited.places.map((place) => place.placeId)).toEqual(legacy.places.map((place) => place.placeId))
  })

  it('keeps the locked original while a new dimension group requires separate signatures', () => {
    const record = findPickupDemoRecord('23343775')!
    const signature = { contactMethod: 'signed' as const, contactName: 'Demo Customer', driverName: 'John Doe',
      contactlessReason: '', contactlessAcknowledged: false, hasDamage: false, exceptionNote: '' }
    const locked = lockPickupEbol(syncPickupOrderEbolDraft(undefined, record), signature)
    const snapshot = structuredClone(locked.pickup)
    let draft = addPickupDraftGroup(createPickupDraft(record, 'NJ1', 'supplemental'))
    const id = pickupDraftGroups(draft)[0].id
    draft = updatePickupDraftGroup(draft, id, 'quantity', 2)
    draft = updatePickupDraftGroup(draft, id, 'weight', 10)
    const projection = pickupDraftToRecord(draft, record)
    expect(projection.placeIds?.slice(0, 3)).toEqual(snapshot.evidence?.placeIds)
    expect(projection.totalWeight).toBe(74)
    const pending = prepareSupplementalPickup(locked, { addedPlaceIds: draft.places.map((place) => place.placeId),
      totalWeight: pickupDraftWeight(draft), totalVolume: pickupDraftVolume(draft), photoCount: 2, changeHistory: draft.history })
    expect(pending.pickupSupplements[0].contact.status).toBe('pending')
    expect(pending.pickupSupplements[0].driver.status).toBe('pending')
    expect(lockSupplementalPickup(pending, 2, signature).pickup).toEqual(snapshot)
  })
})
