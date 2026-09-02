import { describe, expect, it } from 'vitest'
import { buildRehearsalPreset, installRehearsalPreset, rehearsalPresets } from './demoRehearsal'
import { CARGO_RECORDS_STORAGE_KEY } from './cargoDomain'
import { ORDER_DETAILS_STORAGE_KEY, orderDetailsIssues } from './orderDetailsDomain'
import { PICKUP_DRAFTS_STORAGE_KEY, readPickupDrafts, writePickupDrafts } from './pickupDraftStore'
import { ORDER_EBOLS_STORAGE_KEY, readOrderEbols } from './orderEbolStore'
import { canReviewOrderEvidence, createOrderEbol, prepareDeliveryEbol, prepareSupplementalPickup, syncPickupOrderEbolDraft } from './orderEbolDomain'
import { updatePickupDraftGroup } from './pickupDraftDomain'
import { pickupReviewNeedsRefresh } from './pickupReviewState'

function memoryStorage() {
  const data = new Map<string, string>()
  return { data, getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) } }
}

describe('Owner rehearsal presets', () => {
  it.each(rehearsalPresets)('prepares complete, isolated $id data without signing a new handoff', ({ id, order }) => {
    const value = buildRehearsalPreset(id)
    expect(orderDetailsIssues(value.record.orderDetails!)).toEqual([])
    expect(value.draft.places.length).toBeGreaterThan(0)
    expect(value.draft.places.every((place) => place.placeId.startsWith('ZB-' + order + '-'))).toBe(true)
    expect(new Set(value.draft.places.map((place) => place.placeId)).size).toBe(value.draft.places.length)
    expect(value.record.photos?.length).toBe(id === '40' ? 40 : id === '100' ? 100 : id === 'damage' ? 4 : 3)
    expect(Boolean(value.orderEbol?.pickup.lockedAt)).toBe(id === 'supplemental')
    expect(value.orderEbol?.delivery.lockedAt).toBeUndefined()
  })

  it('installs all scenarios without losing other orders or recording an unfinished Pickup', () => {
    const storage = memoryStorage()
    storage.setItem('unrelated-key', 'keep')
    for (const preset of rehearsalPresets) {
      const path = installRehearsalPreset(preset.id, storage)
      expect(path).toContain(preset.order)
    }
    expect(readPickupDrafts(storage)).toHaveLength(6)
    expect(readOrderEbols(storage)).toHaveLength(3)
    expect(JSON.parse(storage.getItem(CARGO_RECORDS_STORAGE_KEY)!).some((item: { orderNumber: string }) => item.orderNumber === '99003001')).toBe(false)
    expect(JSON.parse(storage.getItem('zaberman-spoke-route:v1')!).tasks.filter((item: { stopId: string }) => item.stopId.startsWith('rehearsal-'))).toHaveLength(9)
    expect(storage.getItem('unrelated-key')).toBe('keep')
  })

  it('reopens an edited draft with the same IDs and no duplicate tasks or evidence', () => {
    const storage = memoryStorage()
    installRehearsalPreset('multiple', storage)
    const original = readPickupDrafts(storage)[0]
    const edited = updatePickupDraftGroup(original, original.places[0].dimensionGroupId!, 'quantity', 2)
    writePickupDrafts([edited], storage)
    const route = storage.getItem('zaberman-spoke-route:v1')
    installRehearsalPreset('multiple', storage)
    expect(readPickupDrafts(storage)).toEqual([edited])
    expect(storage.getItem('zaberman-spoke-route:v1')).toBe(route)
  })

  it('resets environment deterministically, while keeping signed facts intact', () => {
    const storage = memoryStorage()
    installRehearsalPreset('supplemental', storage)
    const signed = storage.getItem(ORDER_EBOLS_STORAGE_KEY)
    installRehearsalPreset('offline', storage)
    expect(JSON.parse(storage.getItem('zaberman-prototype-scenarios:v1')!)).toMatchObject({ network: 'offline', syncOutcome: 'retry' })
    installRehearsalPreset('printer', storage)
    expect(JSON.parse(storage.getItem('zaberman-prototype-scenarios:v1')!)).toMatchObject({ network: 'online', devices: { printer: false } })
    installRehearsalPreset('supplemental', storage)
    expect(readOrderEbols(storage).find((item) => item.orderNumber === '99007006')).toEqual(JSON.parse(signed!)[0])
  })

  it('rolls back partial setup and does not leave an incomplete order after a storage error', () => {
    const storage = memoryStorage()
    storage.setItem(ORDER_DETAILS_STORAGE_KEY, '{}')
    const before = [...storage.data]
    const failed = { ...storage, setItem: (key: string, value: string) => {
      if (key === PICKUP_DRAFTS_STORAGE_KEY) throw new Error('Quota')
      storage.setItem(key, value)
    } }
    expect(() => installRehearsalPreset('normal', failed)).toThrow('Could not prepare')
    expect([...storage.data]).toEqual(before)
  })
})

describe('Rehearsal review safeguards', () => {
  it('requires the changed draft to refresh its unsigned review and ignores a locked original', () => {
    const { record, draft } = buildRehearsalPreset('normal')
    const order = createOrderEbol(record)
    expect(pickupReviewNeedsRefresh(order, [draft])).toBe(true)
    order.pickup.evidence!.sourceDraftUpdatedAt = draft.updatedAt
    expect(pickupReviewNeedsRefresh(order, [draft])).toBe(false)
    expect(pickupReviewNeedsRefresh(order, [{ ...draft, updatedAt: 'changed' }])).toBe(true)
    expect(pickupReviewNeedsRefresh(buildRehearsalPreset('supplemental').orderEbol, [draft])).toBe(false)
  })

  it('keeps documented damage when evidence is refreshed and blocks empty evidence', () => {
    const { orderEbol, record } = buildRehearsalPreset('damage')
    const refreshed = syncPickupOrderEbolDraft(orderEbol, record)
    expect(refreshed.pickup.evidence!.exceptionNote).toBe(orderEbol!.pickup.evidence!.exceptionNote)
    expect(refreshed.pickup.evidence!.hasDamage).toBe(true)
    expect(canReviewOrderEvidence({ ...refreshed.pickup.evidence!, photoCount: 0 })).toBe(false)
    expect(canReviewOrderEvidence({ ...refreshed.pickup.evidence!, pieceCount: 0 })).toBe(false)
  })

  it('rejects Delivery with unsigned additions or a different set of cargo places', () => {
    const { record, orderEbol } = buildRehearsalPreset('supplemental')
    const input = { photoCount: 2, hasDamage: false, exceptionNote: '' }
    expect(() => prepareDeliveryEbol(orderEbol!, record, input)).not.toThrow()
    const pending = prepareSupplementalPickup(orderEbol!, { addedPlaceIds: ['extra'], totalWeight: 1, totalVolume: 1, photoCount: 1, changeHistory: [] })
    expect(() => prepareDeliveryEbol(pending, record, input)).toThrow('Sign the Supplemental')
    expect(() => prepareDeliveryEbol(orderEbol!, { ...record, dimensionGroups: [] }, input)).toThrow('Cargo differs')
  })
})
