import { describe, expect, it } from 'vitest'
import { expandCargoPlaces, initialCargoRecords } from './cargoDomain'
import { createOrderEbol, lockPickupEbol, prepareSupplementalPickup } from './orderEbolDomain'
import { addPickupDraftGroup, createPickupDraft, pickupDraftToRecord } from './pickupDraftDomain'
import { createPlaceLabels, labelVersionName, recordLabelPrint, selectPlaceLabels, type LabelPrintState } from './placeLabelsDomain'
import { readLabelPrintState, writeLabelPrintState } from './labelPrintStore'
import { resolvePlaceScan } from './placeScanDomain'

const initialState = (): LabelPrintState => ({ scope: 'all', selectedIds: [], history: [] })
const memoryStorage = () => {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
}

describe('Selective mock label printing', () => {
  it('selects only requested labels while preserving n/N, groups and original order', () => {
    const labels = createPlaceLabels(initialCargoRecords[0])
    const selected = selectPlaceLabels(labels, [labels[4].placeId, labels[0].placeId])
    expect(selected.map((label) => label.placeId)).toEqual([labels[0].placeId, labels[4].placeId])
    expect(selected[1]).toMatchObject({ placeNumber: 5, totalPlaces: 11, dimensionGroupNumber: 2, dimensionGroupId: 'group-2' })
    expect(labels).toHaveLength(11)
  })

  it('ignores duplicate, removed and foreign IDs; an empty selection stays empty', () => {
    const labels = createPlaceLabels(initialCargoRecords[0])
    expect(selectPlaceLabels(labels, [labels[0].placeId, labels[0].placeId, 'missing'])).toEqual([labels[0]])
    expect(selectPlaceLabels(labels, [])).toEqual([])
    expect(recordLabelPrint(initialState(), [], 'success', 'empty').history).toEqual([])
  })

  it('records an exact batch without changing the record or labels', () => {
    const record = structuredClone(initialCargoRecords[0])
    const labels = createPlaceLabels(record).slice(0, 2)
    const selected = labels.map((label) => label.placeId)
    const state = { ...initialState(), selectedIds: selected }
    const printed = recordLabelPrint(state, labels, 'success', 'print-1', '2026-09-02T12:00:00Z')
    expect(printed.history[0]).toMatchObject({ labelIds: selected, outcome: 'success', reprintedIds: [] })
    expect(printed.selectedIds).toEqual(selected)
    expect(state.history).toEqual([])
    expect(record).toEqual(initialCargoRecords[0])
  })

  it('distinguishes reprints from retrying a failed attempt and preserves selection on errors', () => {
    const labels = createPlaceLabels(initialCargoRecords[0]).slice(0, 2)
    const state = { ...initialState(), selectedIds: labels.map((label) => label.placeId) }
    const failed = recordLabelPrint(state, labels, 'error', 'failed')
    const success = recordLabelPrint(failed, labels, 'success', 'retry')
    expect(success.history[0].reprintedIds).toEqual([])
    const reprint = recordLabelPrint(success, [labels[1]], 'success', 'reprint')
    expect(reprint.history[0].labelIds).toEqual([labels[1].placeId])
    expect(reprint.history[0].reprintedIds).toEqual([labels[1].placeId])
    const unavailable = recordLabelPrint(reprint, labels, 'unavailable', 'offline-printer')
    expect(unavailable.selectedIds).toEqual(state.selectedIds)
  })

  it('deduplicates the same attempt and keeps a bounded history', () => {
    const labels = createPlaceLabels(initialCargoRecords[0]).slice(0, 1)
    let state = recordLabelPrint(initialState(), labels, 'success', 'one')
    expect(recordLabelPrint(state, labels, 'success', 'one')).toBe(state)
    for (let i = 0; i < 25; i += 1) state = recordLabelPrint(state, labels, 'success', `attempt-${i}`)
    expect(state.history).toHaveLength(20)
    expect(state.history[0].id).toBe('attempt-24')
  })

  it('separates Supplemental labels without modifying the locked original snapshot', () => {
    const record = initialCargoRecords[0]
    const original = lockPickupEbol(createOrderEbol(record), { contactMethod: 'signed', contactName: 'Demo contact', driverName: 'Demo driver', contactlessReason: '', contactlessAcknowledged: false, hasDamage: false, exceptionNote: '' })
    const snapshot = structuredClone(original.pickup)
    const draft = addPickupDraftGroup(createPickupDraft(record, 'NJ1', 'supplemental'))
    const addedId = draft.places[0].placeId
    const ebol = prepareSupplementalPickup(original, { addedPlaceIds: [addedId], totalWeight: 0, totalVolume: 0, photoCount: 1, changeHistory: [] })
    const labels = createPlaceLabels(pickupDraftToRecord(draft, record), ebol)
    expect(labels.filter((label) => label.pickupVersion === 1)).toHaveLength(11)
    expect(labels.filter((label) => label.pickupVersion === 2)).toMatchObject([{ placeId: addedId, placeNumber: 12, totalPlaces: 12, versionLocked: false }])
    expect(labels[0].versionLocked).toBe(true)
    expect(ebol.pickup).toEqual(snapshot)
    expect(labelVersionName(2)).toBe('Supplemental v2')
  })

  it('restores selection, scope and history only for their order', () => {
    const storage = memoryStorage()
    const labels = createPlaceLabels(initialCargoRecords[0]).slice(0, 1)
    const state = recordLabelPrint({ ...initialState(), scope: '1', selectedIds: [labels[0].placeId] }, labels, 'error', 'attempt')
    expect(writeLabelPrintState('11155599', state, storage)).toBe(true)
    expect(readLabelPrintState('11155599', storage)).toEqual(state)
    expect(readLabelPrintState('other', storage)).toEqual(initialState())
  })

  it('handles missing/corrupt state and storage errors', () => {
    expect(readLabelPrintState('1', { getItem: () => 'bad-json', setItem: () => {} })).toEqual(initialState())
    expect(readLabelPrintState('1', { getItem: () => '{"history":[null,{}],"selectedIds":[42]}', setItem: () => {} })).toEqual(initialState())
    expect(writeLabelPrintState('1', initialState(), { getItem: () => null, setItem: () => { throw new Error('quota') } })).toBe(false)
  })
})

describe('Demo label scan', () => {
  const places = expandCargoPlaces(initialCargoRecords[0])
  it('resolves the supplied label instead of a hard-coded place', () => {
    expect(resolvePlaceScan(places, ' zb-11155599-05 ', [])).toMatchObject({ kind: 'found', place: { placeId: 'ZB-11155599-05', placeNumber: 5 } })
  })
  it('identifies a repeat without changing the cargo collection', () => {
    const before = structuredClone(places)
    expect(resolvePlaceScan(places, places[0].placeId, [places[0].placeId]).kind).toBe('duplicate')
    expect(places).toEqual(before)
  })
  it('rejects unknown/partial codes and does not turn arbitrary strings into order IDs', () => {
    for (const code of ['', 'ZB-UNKNOWN-00', '111555', 'x11155599', 'ZB-11155599-999']) expect(resolvePlaceScan(places, code, []).kind).toBe('unknown')
  })
  it('resolves an exact order code to its places', () => {
    expect(resolvePlaceScan(places, '#11155599', [])).toEqual({ kind: 'order', orderNumber: '11155599', count: 11 })
  })
})
