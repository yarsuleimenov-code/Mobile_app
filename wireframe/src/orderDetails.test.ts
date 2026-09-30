import { describe, expect, it } from 'vitest'
import { editOrderDetails, initialOrderDetails, operationalName, orderDetailsIssues, canEditInternalName } from './orderDetailsDomain'
import { calculatePieces, calculateVolume, expandCargoPlaces, initialCargoRecords } from './cargoDomain'
import { dimensionState, dimensionText, measurementIssues, summarizeMeasurements, weightText, volumeText } from './measurementDomain'
import { addPickupDraftGroup, createPickupDraft, pickupDraftGroups, pickupDraftToRecord, pickupDraftWeight, updatePickupDraftGroup, updatePickupMeasurementNote } from './pickupDraftDomain'
import { findPickupDemoRecord } from './pickupDemoData'
import { canReviewOrderEvidence, createOrderEbol, lockPickupEbol, lockSupplementalPickup, prepareSupplementalPickup, withCurrentOrderDetails } from './orderEbolDomain'
import { expandRecordPlaces, summarizeLoadedPlaces } from './interstateDomain'
import { createPlaceLabels } from './placeLabelsDomain'
import { readPickupDrafts, writePickupDrafts } from './pickupDraftStore'

const signature = { contactMethod: 'signed' as const, contactName: 'Morgan Lee', driverName: 'Chris Adams',
  hasDamage: false, exceptionNote: '' }

describe('Stage 6 order data', () => {
  it('keeps a full external name, short operational name and separate quantities', () => {
    const details = initialOrderDetails('23343775')
    expect(details.trade_name.length).toBeGreaterThan(80)
    expect(operationalName(details, '23343775')).toBe('Dining Chair')
    expect(initialOrderDetails('23343780').internal_name).toBe('Chair + Ottoman')
    expect(calculatePieces(findPickupDemoRecord('23343780')!.dimensionGroups)).toBe(5)
  })
  it('allows dispatcher edits without changing source or external name; audits the changed fields', () => {
    const details = initialOrderDetails('23343775')
    const edited = editOrderDetails(details, { ...details, internal_name: 'Oak chairs', special_cargo_type: 'fragile', special_cargo_details: 'Protect legs' }, 'dispatcher', '2026-09-02T10:00:00Z')
    expect(edited.trade_name).toBe(details.trade_name)
    expect(edited.name_source).toBe(details.name_source)
    expect(edited.history.map((item) => item.field)).toEqual(['internal_name', 'special_cargo_type', 'special_cargo_details'])
    expect(edited.history[0]).toMatchObject({ role: 'dispatcher', before: 'Dining Chair', after: 'Oak chairs' })
    expect(editOrderDetails(edited, edited, 'dispatcher').history).toEqual(edited.history)
  })
  it('enforces roles beyond read-only controls; supervisor fills a missing name only once', () => {
    const missing = { ...initialOrderDetails('23343775'), internal_name: '' }
    for (const role of ['driver', 'delivery', 'warehouse', 'admin'] as const) {
      expect(() => editOrderDetails(missing, { ...missing, internal_name: 'Chairs' }, role)).toThrow('role')
    }
    const filled = editOrderDetails(missing, { ...missing, internal_name: 'Chairs' }, 'supervisor')
    expect(canEditInternalName('supervisor', filled)).toBe(false)
    expect(() => editOrderDetails(filled, { ...filled, internal_name: 'Other' }, 'supervisor')).toThrow('role')
    expect(() => editOrderDetails(missing, { ...missing, special_cargo_type: 'fragile' }, 'supervisor')).toThrow('role')
  })
  it('saves incomplete order data, uses fallback, and blocks review, not draft persistence', () => {
    const initial = initialOrderDetails('23343775')
    const empty = editOrderDetails(initial, { ...initial, internal_name: '  ', special_cargo_type: 'fragile', special_cargo_details: '' }, 'dispatcher')
    expect(operationalName(empty, '23343775')).toBe(initial.trade_name)
    expect(orderDetailsIssues(empty)).toHaveLength(2)
    expect(operationalName(initialOrderDetails('999'), '999')).toBe('Order #999')
    expect(() => editOrderDetails(initial, { ...initial, internal_name: 'x'.repeat(81) }, 'dispatcher')).toThrow('80')
    const order = createOrderEbol({ ...findPickupDemoRecord('23343775')!, orderDetails: empty })
    expect(canReviewOrderEvidence(order.pickup.evidence)).toBe(false)
    expect(() => lockPickupEbol(order, signature)).toThrow('incomplete')
  })
  it('refreshes unsigned names but freezes names and labels in every signed version', () => {
    const record = findPickupDemoRecord('23343775')!
    const original = createOrderEbol(record)
    const renamed = { ...initialOrderDetails(record.orderNumber), internal_name: 'Oak chairs' }
    const updated = withCurrentOrderDetails(original, 'pickup', renamed)!
    expect(updated.pickup.evidence?.orderDetails?.internal_name).toBe('Oak chairs')
    const locked = lockPickupEbol(updated, signature)
    const frozen = structuredClone(locked.pickup)
    renamed.internal_name = 'Current chairs'
    expect(withCurrentOrderDetails(locked, 'pickup', renamed)!.pickup).toEqual(frozen)
    expect(createPlaceLabels(record, locked, renamed).every((label) => label.orderTitle === 'Oak chairs')).toBe(true)
    const extra = prepareSupplementalPickup(locked, { addedPlaceIds: ['ZB-23343775-04'], totalWeight: 10, totalVolume: 1, photoCount: 1, changeHistory: [], orderDetails: renamed })
    const signed = lockSupplementalPickup(extra, 2, signature)
    renamed.internal_name = 'Later name'
    expect(signed.pickupSupplements[0].evidence?.orderDetails?.internal_name).toBe('Current chairs')
    expect(signed.pickup).toEqual(frozen)
  })
})

describe('Stage 6 unknown measurements', () => {
  it('excludes partial or not measurable places from volume, but never excludes quantity', () => {
    const groups = [
      { id: 'complete', quantity: 2, length: 12, width: 12, height: 12, weight: 10 },
      { id: 'partial', quantity: 3, length: 12, width: null, height: 12, weight: null, unknownReason: 'Crated' },
      { id: 'blocked', quantity: 1, length: 12, width: 12, height: 12, weight: 5, notMeasurable: true, unknownReason: 'Access blocked' },
    ]
    expect(calculatePieces(groups)).toBe(6)
    expect(calculateVolume(groups)).toBe(2)
    const summary = summarizeMeasurements(groups)
    expect(summary.incompletePlaces).toBe(4)
    expect(summary.unknownWeightPlaces).toBe(3)
    expect(summary.reasons).toHaveLength(2)
    expect(measurementIssues(groups)).toEqual([])
    expect(dimensionText(groups[1])).toBe('12 × — × 12 in')
    expect(dimensionState(groups[2])).toBe('not_measurable')
    expect(weightText(25, summary)).toBe('25 lb known')
    expect(volumeText(2, summary)).toBe('2.00 cu ft known')
    expect(volumeText(0, summary)).toBe('Not measured')
  })
  it('saves nulls and reasons, restores group edits without recycling PlaceIDs', () => {
    let draft = addPickupDraftGroup(createPickupDraft(findPickupDemoRecord('23343775'), 'NJ1', 'standard'))
    const id = pickupDraftGroups(draft).at(-1)!.id
    expect(draft.places.at(-1)?.weight).toBeNull()
    expect(measurementIssues(pickupDraftGroups(draft))).toHaveLength(1)
    draft = updatePickupMeasurementNote(draft, id, { unknownReason: 'Scale unavailable; packed crate' })
    draft = updatePickupDraftGroup(draft, id, 'quantity', 2)
    const addedIds = draft.places.slice(3).map((item) => item.placeId)
    const memory = new Map<string, string>()
    const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) }
    expect(writePickupDrafts([draft], storage)).toBe(true)
    const restored = readPickupDrafts(storage)[0]
    expect(restored).toEqual(draft)
    expect(pickupDraftWeight(restored)).toBe(54)
    const saved = pickupDraftToRecord(restored)
    const places = expandCargoPlaces(saved)
    expect(places.slice(3).map((place) => place.placeId)).toEqual(addedIds)
    expect(places[3]).toMatchObject({ estimatedWeight: null, dimensions: 'Not measured', weightSource: 'unknown' })
    expect(createPickupDraft(saved, 'NJ1', 'standard').places).toEqual(restored.places)
    const evidence = createOrderEbol(saved).pickup.evidence!
    expect(canReviewOrderEvidence(evidence)).toBe(true)
    expect(evidence.measurements?.unknownWeightPlaces).toBe(2)
    expect(evidence.totalVolume).toBe(36)
    expect(canReviewOrderEvidence({ ...evidence, measurements: { ...evidence.measurements!, reasons: [{ ...evidence.measurements!.reasons[0], reason: '' }] } })).toBe(false)
  })
  it('carries known-only totals into existing Interstate summaries', () => {
    const record = { ...findPickupDemoRecord('23343775')!, dimensionGroups: [
      { id: 'unknown', quantity: 2, length: null, width: null, height: null, weight: null, unknownReason: 'Packed' },
      { id: 'known', quantity: 1, length: 12, width: 12, height: 12, weight: 8 },
    ], totalWeight: 8 }
    expect(summarizeLoadedPlaces(expandRecordPlaces(record))).toMatchObject({
      placeCount: 3, loadedWeight: 8, loadedVolume: 1, unknownWeightPlaces: 2, incompletePlaces: 2,
    })
  })
  it('keeps legacy allocations known, while legacy zero measurements become unknown', () => {
    const legacy = initialCargoRecords[0]
    expect(summarizeMeasurements(legacy.dimensionGroups).unknownWeightPlaces).toBe(0)
    expect(expandCargoPlaces(legacy)[0].weightSource).toBe('allocated_from_order_total')
    const draft = createPickupDraft(findPickupDemoRecord('23343775'), 'NJ1', 'standard')
    draft.places[0] = { ...draft.places[0], length: 0, weight: 0 }
    const groups = pickupDraftGroups(draft)
    expect(groups[0].length).toBeNull()
    expect(groups[0].weight).toBeNull()
    expect(measurementIssues(groups)).toHaveLength(1)
    expect(calculatePieces(groups)).toBe(3)
  })
})
