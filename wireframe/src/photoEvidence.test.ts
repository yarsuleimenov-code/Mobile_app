import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { readDeliveryDraft, writeDeliveryDraft } from './deliveryDraftStore'
import { addPickupDraftGroup, createPickupDraft, pickupDraftToRecord } from './pickupDraftDomain'
import { readPickupDrafts, writePickupDrafts } from './pickupDraftStore'
import { createOrderEbol, lockDeliveryEbol, lockPickupEbol, lockSupplementalPickup, prepareDeliveryEbol, prepareSupplementalPickup, syncPickupOrderEbolDraft } from './orderEbolDomain'
import { addEvidencePhoto, beginEvidenceSync, demoPhotos, evidencePhotos, finishEvidenceSync, readEvidenceQueue, removeEvidencePhoto, resolveEvidenceConflict, trackEvidence, writeEvidenceQueue, type EvidenceOperation } from './photoEvidenceDomain'

const memoryStorage = () => {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
}
const operation = (id = 'pickup:11155599:standard'): EvidenceOperation => ({
  id, orderNumber: '11155599', handoff: 'pickup', photos: demoPhotos('11155599', 'pickup', 3), detail: '3 photos', fingerprint: 'draft-1',
})
const signed = { contactMethod: 'signed' as const, contactName: 'Demo contact', driverName: 'Demo driver',
  contactlessReason: '', contactlessAcknowledged: false, hasDamage: false, exceptionNote: '' }

describe('Mock photo evidence', () => {
  it('migrates count-only evidence deterministically and preserves an explicitly empty collection', () => {
    const first = evidencePhotos({ photoCount: 3 }, '1', 'pickup')
    expect(evidencePhotos({ photoCount: 3 }, '1', 'pickup')).toEqual(first)
    expect(first.map((photo) => photo.category)).toEqual(['before', 'packaging', 'condition'])
    expect(evidencePhotos({ photoCount: 3, photos: [] }, '1', 'pickup')).toEqual([])
    expect(demoPhotos('1', 'delivery', 1)[0].id).not.toBe(first[0].id)
  })

  it('adds idempotently and removes only the selected photo without renumbering IDs', () => {
    const photos = demoPhotos('1', 'pickup', 3)
    expect(addEvidencePhoto(photos, photos[0])).toBe(photos)
    const remaining = removeEvidencePhoto(photos, photos[1].id)
    expect(remaining.map((photo) => photo.id)).toEqual([photos[0].id, photos[2].id])
    expect(photos).toHaveLength(3)
  })

  it('restores Pickup photos and PlaceIDs, including legacy drafts, after reload', () => {
    const storage = memoryStorage()
    const draft = createPickupDraft(initialCargoRecords[0], 'NJ1', 'standard')
    draft.photos = removeEvidencePhoto(draft.photos!, draft.photos![0].id)
    draft.photoCount = draft.photos.length
    expect(writePickupDrafts([draft], storage)).toBe(true)
    const restored = readPickupDrafts(storage)[0]
    expect(restored).toEqual(draft)
    expect(pickupDraftToRecord(restored).photos).toEqual(draft.photos)
    const legacy = { ...draft, photos: undefined }
    expect(evidencePhotos(legacy, draft.orderNumber, 'pickup')).toHaveLength(draft.photoCount)
  })

  it('restores Delivery photos and checks separately for each order', () => {
    const storage = memoryStorage()
    const draft = { ...readDeliveryDraft('1', storage), damageReported: true, damageNote: 'Demo scratch' }
    draft.photos = [...draft.photos, { ...draft.photos[0], id: 'damage-photo', category: 'damage' }]
    expect(writeDeliveryDraft('1', draft, storage)).toBe(true)
    expect(readDeliveryDraft('1', storage)).toEqual(draft)
    expect(readDeliveryDraft('2', storage).damageReported).toBe(false)
    expect(readDeliveryDraft('2', storage).photos).toHaveLength(2)
  })

  it('copies photo evidence into independent locked Pickup, supplemental and Delivery snapshots', () => {
    const record = { ...initialCargoRecords[0], photos: demoPhotos('11155599', 'pickup', 4) }
    const original = lockPickupEbol(createOrderEbol(record), signed)
    const originalSnapshot = structuredClone(original.pickup)
    record.photos[0].category = 'damage'
    expect(original.pickup).toEqual(originalSnapshot)
    expect(syncPickupOrderEbolDraft(original, record)).toBe(original)
    const added = demoPhotos('11155599', 'pickup', 1, 'supplement-2')
    const supplemental = lockSupplementalPickup(prepareSupplementalPickup(original, {
      addedPlaceIds: ['ZB-11155599-12'], totalWeight: 18, totalVolume: 2, photoCount: 1, photos: added, changeHistory: [],
    }), 2, signed)
    const delivered = lockDeliveryEbol(prepareDeliveryEbol(supplemental, record, {
      photoCount: 2, photos: demoPhotos('11155599', 'delivery', 2), hasDamage: false, exceptionNote: '',
    }), signed)
    added[0].category = 'damage'
    expect(delivered.pickup).toEqual(originalSnapshot)
    expect(delivered.pickupSupplements[0].evidence?.photos?.[0].category).toBe('before')
    expect(delivered.delivery.evidence?.photos?.every((photo) => photo.handoff === 'delivery')).toBe(true)
    expect(delivered.pickupSupplements[0].evidence?.photos).toHaveLength(1)
  })

  it('builds 100 compact references, not encoded files', () => {
    const photos = demoPhotos('1', 'pickup', 100)
    expect(new Set(photos.map((photo) => photo.id)).size).toBe(100)
    expect(new Set(photos.map((photo) => photo.asset)).size).toBe(4)
    expect(JSON.stringify(photos).length).toBeLessThan(20000)
  })

  it('derives snapshot counts from photos and rejects empty Delivery evidence', () => {
    const record = { ...initialCargoRecords[0], photoCount: 9, photos: demoPhotos('11155599', 'pickup', 2) }
    const pickup = lockPickupEbol(createOrderEbol(record), signed)
    expect(pickup.pickup.evidence?.photoCount).toBe(2)
    expect(() => prepareDeliveryEbol(pickup, record, { photoCount: 9, photos: [], hasDamage: false, exceptionNote: '' })).toThrow('at least one photo')
  })

  it('resaves a Supplemental draft without duplicating its photos or places', () => {
    const original = initialCargoRecords[0]
    const draft = addPickupDraftGroup(createPickupDraft(original, 'NJ1', 'supplemental'))
    draft.photos = demoPhotos(original.orderNumber, 'pickup', 2, 'supplement-2')
    draft.photoCount = 2
    const once = pickupDraftToRecord(draft, original)
    const twice = pickupDraftToRecord(draft, once)
    expect(twice.photos).toEqual(once.photos)
    expect(twice.photoCount).toBe(original.photoCount + 2)
    expect(twice.placeIds).toEqual(once.placeIds)
    const edited = { ...draft, photos: draft.photos.slice(1), photoCount: 1 }
    const removed = pickupDraftToRecord(edited, twice)
    expect(removed.photoCount).toBe(original.photoCount + 1)
    expect(removed.photos?.some((photo) => photo.id === draft.photos![0].id)).toBe(false)
  })
})

describe('Local demo evidence queue', () => {
  it('tracks one operation and its photos idempotently, and restores pending/errors', () => {
    const storage = memoryStorage()
    const queue = trackEvidence([], operation())
    expect(trackEvidence(queue, operation())).toBe(queue)
    const failed = finishEvidenceSync(queue, beginEvidenceSync(queue), 'retry')
    expect(writeEvidenceQueue(failed, storage)).toBe(true)
    expect(readEvidenceQueue(storage)).toEqual(failed)
    expect(failed).toHaveLength(4)
    expect(failed.every((item) => item.status === 'retry')).toBe(true)
  })

  it('retries without duplicating photos, operations or PlaceIDs', () => {
    const draft = createPickupDraft(initialCargoRecords[0], 'NJ1', 'standard')
    const originalPlaces = structuredClone(draft.places)
    const queue = trackEvidence([], operation())
    const failed = finishEvidenceSync(queue, beginEvidenceSync(queue), 'retry')
    const done = finishEvidenceSync(failed, beginEvidenceSync(failed), 'success')
    expect(done.map((item) => item.id)).toEqual(queue.map((item) => item.id))
    expect(done.every((item) => item.status === 'synced')).toBe(true)
    expect(beginEvidenceSync(done)).toEqual([])
    expect(draft.places).toEqual(originalPlaces)
  })

  it('does not acknowledge a newer edit or resurrect removed photos after an in-flight result', () => {
    const op = operation()
    const queue = trackEvidence([], op)
    const batch = beginEvidenceSync(queue)
    const edited = trackEvidence(queue, { ...op, photos: op.photos.slice(1), fingerprint: 'draft-2', detail: '2 photos' })
    const done = finishEvidenceSync(edited, batch, 'success')
    expect(done.find((item) => item.kind === 'operation')?.status).toBe('pending')
    expect(done.some((item) => item.detail === op.photos[0].id)).toBe(false)
    expect(done).toHaveLength(3)
  })

  it('returns interrupted sync to pending and retains conflicts across reload', () => {
    const storage = memoryStorage()
    const queue = trackEvidence([], operation())
    writeEvidenceQueue(queue.map((item) => ({ ...item, status: 'syncing' })), storage)
    expect(readEvidenceQueue(storage).every((item) => item.status === 'pending')).toBe(true)
    const conflict = finishEvidenceSync(queue, beginEvidenceSync(queue), 'conflict')
    writeEvidenceQueue(conflict, storage)
    expect(readEvidenceQueue(storage)).toEqual(conflict)
    expect(beginEvidenceSync(readEvidenceQueue(storage))).toEqual([])
  })

  it('requires explicit conflict resolution and never mutates the photo payload', () => {
    const op = operation()
    const photos = structuredClone(op.photos)
    const queue = trackEvidence([], op)
    const conflict = finishEvidenceSync(queue, beginEvidenceSync(queue), 'conflict')
    expect(conflict.filter((item) => item.status === 'conflict')).toHaveLength(1)
    const resolved = resolveEvidenceConflict(conflict, op.id)
    const done = finishEvidenceSync(resolved, beginEvidenceSync(resolved), 'conflict')
    expect(done.every((item) => item.status === 'synced')).toBe(true)
    expect(op.photos).toEqual(photos)
    expect(trackEvidence(done, { ...op, fingerprint: 'new-edit' }).find((item) => item.kind === 'operation')?.resolution).toBeUndefined()
  })

  it('isolates operations and preserves pending when the connection drops', () => {
    const first = operation()
    const second = operation('pickup:other-order')
    const queue = trackEvidence(trackEvidence([], first), second)
    const batch = beginEvidenceSync(queue, first.id)
    const done = finishEvidenceSync(queue, batch, 'success')
    expect(done.filter((item) => item.operationId === second.id).every((item) => item.status === 'pending')).toBe(true)
    const interrupted = finishEvidenceSync(queue, batch, 'offline')
    expect(interrupted.every((item) => item.status === 'pending')).toBe(true)
  })

  it('handles malformed storage and exposes write failures', () => {
    expect(readEvidenceQueue({ getItem: () => 'invalid', setItem: () => {} })).toEqual([])
    expect(readEvidenceQueue({ getItem: () => '[{},null]', setItem: () => {} })).toEqual([])
    expect(writeEvidenceQueue([], { getItem: () => null, setItem: () => { throw new Error('quota') } })).toBe(false)
  })
})
