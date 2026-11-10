import { describe, expect, it } from 'vitest'
import { buildRehearsalPreset, installRehearsalPreset, rehearsalPresets } from './demoRehearsal'
import { CARGO_RECORDS_STORAGE_KEY } from './cargoDomain'
import { ORDER_DETAILS_STORAGE_KEY, orderDetailsIssues } from './orderDetailsDomain'
import { PICKUP_DRAFTS_STORAGE_KEY, readPickupDrafts, writePickupDrafts } from './pickupDraftStore'
import { ORDER_EBOLS_STORAGE_KEY, readOrderEbols } from './orderEbolStore'
import { canReviewOrderEvidence, createOrderEbol, prepareDeliveryEbol, prepareSupplementalPickup, syncPickupOrderEbolDraft } from './orderEbolDomain'
import { updatePickupDraftGroup } from './pickupDraftDomain'
import { pickupReviewNeedsRefresh } from './pickupReviewState'
import { readVehicleInspection } from './preTripInspectionStore'
import { emptyVehicleInspection, VEHICLE_INSPECTIONS_STORAGE_KEY } from './postTripInspectionDomain'
import { parseStopProgress, stopProgressKey, summarizeRouteStops } from './routeStopProgress'
import { routeForVehicleCycle, SPOKE_ROUTE_STORAGE_KEY } from './spokeRouteStore'
import { beginEvidenceSync, EVIDENCE_QUEUE_KEY, finishEvidenceSync, readEvidenceQueue } from './photoEvidenceDomain'

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
    expect(Boolean(value.orderEbol?.pickup.lockedAt)).toBe(id === 'supplemental' || id === 'otp')
    expect(value.orderEbol?.delivery.lockedAt).toBeUndefined()
    if (id === 'otp') expect(value.orderEbol?.delivery.evidence?.photoCount).toBe(2)
  })

  it('installs all scenarios without losing other orders or recording an unfinished Pickup', () => {
    const storage = memoryStorage()
    storage.setItem('unrelated-key', 'keep')
    for (const preset of rehearsalPresets) {
      const path = installRehearsalPreset(preset.id, storage)
      expect(path).toContain(preset.order)
    }
    expect(readPickupDrafts(storage)).toHaveLength(6)
    expect(readOrderEbols(storage)).toHaveLength(4)
    expect(JSON.parse(storage.getItem(CARGO_RECORDS_STORAGE_KEY)!).some((item: { orderNumber: string }) => item.orderNumber === '99003001')).toBe(false)
    expect(JSON.parse(storage.getItem('zaberman-spoke-route:v1')!).tasks.filter((item: { stopId: string }) => item.stopId.startsWith('rehearsal-'))).toHaveLength(10)
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

describe('Route and warehouse rehearsals', () => {
  it('opens a route ready for warehouse return without starting Post-trip or signing orders', () => {
    const storage = memoryStorage()
    expect(installRehearsalPreset('route-close', storage)).toBe('/')
    const route = JSON.parse(storage.getItem(SPOKE_ROUTE_STORAGE_KEY)!)
    const cycle = readVehicleInspection(storage)
    const entries = parseStopProgress(storage.getItem(stopProgressKey(route))!)
    expect(routeForVehicleCycle(route, cycle.inspection.completedAt)).toEqual(route)
    expect(cycle.inspection).toMatchObject({ inspectedBy: 'John Doe', odometer: 12450, attested: true })
    expect(cycle.postTrip.startedAt).toBeUndefined()
    expect(summarizeRouteStops(route, entries)).toMatchObject({ completed: 1, failed: [{ reason: 'Recipient unavailable' }], remaining: [] })
    expect(readOrderEbols(storage)).toEqual([])
    installRehearsalPreset('normal', storage)
    installRehearsalPreset('route-close', storage)
    expect(JSON.parse(storage.getItem(SPOKE_ROUTE_STORAGE_KEY)!)).toEqual(route)
    expect(readVehicleInspection(storage)).toEqual(cycle)
  })

  it('keeps an unfinished vehicle inspection when warehouse return is selected', () => {
    const storage = memoryStorage()
    const active = JSON.stringify({ ...emptyVehicleInspection, inspection: { ...emptyVehicleInspection.inspection, odometer: 900 } })
    storage.setItem(VEHICLE_INSPECTIONS_STORAGE_KEY, active)
    expect(() => installRehearsalPreset('route-close', storage)).toThrow('Finish the current vehicle cycle')
    expect([...storage.data]).toEqual([[VEHICLE_INSPECTIONS_STORAGE_KEY, active]])
  })

  it('opens the loading screen directly without creating a driver route', () => {
    const storage = memoryStorage()
    expect(installRehearsalPreset('next-day-load', storage)).toBe('/route-loading')
    expect(storage.getItem(SPOKE_ROUTE_STORAGE_KEY)).toBeNull()
    expect(JSON.parse(storage.getItem('zaberman-prototype-scenarios:v1')!)).toMatchObject({ role: 'warehouse', branch: 'NJ1' })
  })

  it('seeds a partial sync and preserves the retry state when reopened', () => {
    const storage = memoryStorage()
    expect(installRehearsalPreset('partial-sync', storage)).toBe('/more')
    const queue = readEvidenceQueue(storage)
    expect(queue.map((item) => item.status)).toEqual(['pending', 'pending'])
    const after = finishEvidenceSync(queue, beginEvidenceSync(queue), 'partial')
    expect(after.map((item) => item.status)).toEqual(['synced', 'retry'])
    storage.setItem(EVIDENCE_QUEUE_KEY, JSON.stringify(after))
    installRehearsalPreset('partial-sync', storage)
    expect(readEvidenceQueue(storage)).toEqual(after)
    expect(JSON.parse(storage.getItem('zaberman-prototype-scenarios:v1')!)).toMatchObject({ network: 'online', syncOutcome: 'partial' })
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
