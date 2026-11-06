import { describe, expect, it, vi, afterEach } from 'vitest'
import { checkLabelLocation, defaultVerificationPolicy, distanceMeters, verifyHandoff } from './handoffVerificationDomain'
import { capturePrototypeLabelLocation, readLabelActivity, readLabelScanScenario, saveLabelActivity } from './handoffVerificationStore'
import { initialCargoRecords } from './cargoDomain'
import { createOrderEbol, lockDeliveryEbol, lockPickupEbol, lockSupplementalPickup, prepareDeliveryEbol, prepareSupplementalPickup } from './orderEbolDomain'
import type { SpokeTask } from './spokeDomain'

const now = Date.parse('2026-11-03T10:00:00Z')
const target = { latitude: 42, longitude: -71 }
const task: SpokeTask = { stopId: 'pickup-stop', sequence: 1, externalId: '11155599', operation: 'pickup',
  address: 'Pickup address', title: 'Cargo', scheduledTime: '10:00 AM', coordinates: target }
const base = { orderNumber: '11155599', operation: 'pickup' as const, task, target,
  code: 'ZB-11155599-01', labels: [{ placeId: 'ZB-11155599-01', orderNumber: '11155599' }, { placeId: 'FOREIGN-LABEL', orderNumber: '222' }],
  fix: { ...target, accuracy: 5, capturedAt: now }, policy: defaultVerificationPolicy }
const signed = { contactMethod: 'signed' as const, contactName: 'Contact', driverName: 'John Doe', hasDamage: false, exceptionNote: '' }
afterEach(() => vi.unstubAllGlobals())

describe('QR and location verification', () => {
  it('checks a known label without case/whitespace sensitivity', () => {
    const check = verifyHandoff({ ...base, code: ' zb-11155599-01 ' }, now)
    expect(check).toMatchObject({ qr: 'matched', location: 'passed' })
  })
  it('warns for another order without changing active order or operation', () => {
    const check = verifyHandoff({ ...base, code: 'FOREIGN-LABEL' }, now)
    expect(check).toMatchObject({ orderNumber: '11155599', scannedOrder: '222', operation: 'pickup', qr: 'wrong_order' })
  })
  it.each(['ZB-11155599-99', '11155599', 'https://unknown.example/11155599', ''])('does not infer an order from unknown payload %s', (code) => {
    const check = verifyHandoff({ ...base, code }, now)
    expect(check.qr).toBe('unknown')
  })
  it('checks distances in meters and respects a changed radius', () => {
    expect(distanceMeters(target, target)).toBe(0)
    expect(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111195, 0)
    const fix = { ...base.fix, latitude: 42.002 }
    const check = verifyHandoff({ ...base, fix }, now)
    expect(check.distance).toBeGreaterThan(220)
    expect(check.location).toBe('outside')
    expect(verifyHandoff({ ...base, fix, policy: { ...defaultVerificationPolicy, radius: 300 } }, now).location).toBe('passed')
  })
  it('does not confirm an uncertain boundary even when reported coordinates are inside', () => {
    const check = verifyHandoff({ ...base, fix: { ...base.fix, latitude: 42.0008, accuracy: 30 } }, now)
    expect(check.distance).toBeLessThan(100)
    expect(check.location).toBe('inaccurate')
  })
  it.each([
    { fix: { ...base.fix, accuracy: 101 }, expected: 'inaccurate' },
    { fix: { ...base.fix, capturedAt: now - 30001 }, expected: 'stale' },
    { fix: { ...base.fix, capturedAt: now + 5000 }, expected: 'stale' },
    { fix: { ...base.fix, latitude: NaN }, expected: 'unavailable' },
    { fix: { ...base.fix, accuracy: -1 }, expected: 'unavailable' },
    { fix: undefined, expected: 'unavailable' },
  ])('does not treat bad location as success: $expected', ({ fix, expected }) => {
    expect(verifyHandoff({ ...base, fix }, now).location).toBe(expected)
  })
  it.each(['denied', 'unavailable'] as const)('keeps %s separate from success', (error) => {
    expect(verifyHandoff({ ...base, error }, now).location).toBe(error)
  })
  it('never substitutes Pickup coordinates for Delivery coordinates', () => {
    const delivery = { ...task, stopId: 'delivery-stop', operation: 'dropoff' as const, address: 'Delivery address', coordinates: { latitude: 43, longitude: -71 } }
    const check = verifyHandoff({ ...base, operation: 'dropoff', task: delivery, target: delivery.coordinates }, now)
    expect(check).toMatchObject({ address: 'Delivery address', stopId: 'delivery-stop', location: 'outside' })
  })
  it('rejects a target from another operation or order', () => {
    for (const task of [{ ...base.task, operation: 'dropoff' as const }, { ...base.task, externalId: '222' }]) {
      expect(verifyHandoff({ ...base, task }, now)).toMatchObject({ location: 'missing_coordinates', address: '', stopId: undefined })
    }
  })
  it('reports missing coordinates separately', () => {
    const check = verifyHandoff({ ...base, target: undefined }, now)
    expect(check.location).toBe('missing_coordinates')
    expect(check.distance).toBeUndefined()
  })
})

describe('prototype location capture', () => {
  it('uses the same successful route check with or without fixture coordinates', () => {
    const getCurrentPosition = vi.fn()
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    for (const routeTask of [task, { ...task, coordinates: undefined }]) {
      const location = capturePrototypeLabelLocation(routeTask)
      expect(checkLabelLocation({ task: routeTask, ...location })).toMatchObject({
        location: 'passed', distance: 0, address: task.address,
      })
    }
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('records a fix for a manual order without inventing a stop address', () => {
    const location = checkLabelLocation(capturePrototypeLabelLocation())
    expect(location).toMatchObject({ address: '', location: 'missing_coordinates', fix: { accuracy: 5 } })
    expect(location.target).toBeUndefined()
  })

  it('ignores previously saved GPS presets while retaining the label scan case', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ scenario: 'denied', radius: 1, qrScenario: 'wrong_order' }) })
    expect(readLabelScanScenario()).toBe('wrong_order')
    expect(checkLabelLocation({ task, ...capturePrototypeLabelLocation(task) }).location).toBe('passed')
  })
})

it('keeps label checks separate from Pickup, Supplemental and Delivery signatures', () => {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  })
  const context = { order: base.orderNumber, operation: base.operation, stopId: task.stopId }
  const check = verifyHandoff({ ...base, code: 'FOREIGN-LABEL', error: 'denied' }, now)
  expect(saveLabelActivity('scan', context, check)).toBe(true)
  expect(readLabelActivity('scan', context)).toEqual(check)
  expect(readLabelActivity('scan', { ...context, operation: 'dropoff' })).toBeNull()

  const stopVisit = { stopId: task.stopId, startedAt: new Date(now - 1000).toISOString() }
  const at = new Date(now).toISOString()
  const pickup = lockPickupEbol(createOrderEbol(initialCargoRecords[0]), { ...signed, stopVisit }, at)
  expect(pickup.pickup).toMatchObject({ lockedAt: at, stopVisit })
  expect(pickup.pickup.verification).toBeUndefined()
  const draft = prepareSupplementalPickup(pickup, { addedPlaceIds: ['ZB-11155599-99'], totalWeight: 18, totalVolume: 3, photoCount: 1, changeHistory: [] })
  const supplemental = lockSupplementalPickup(draft, 2, signed, at)
  expect(supplemental.pickupSupplements[0]).toMatchObject({ lockedAt: at })
  const ready = prepareDeliveryEbol(pickup, initialCargoRecords[0], { photoCount: 1, hasDamage: false, exceptionNote: '' })
  const deliveryVisit = { ...stopVisit, stopId: 'delivery-stop' }
  const delivery = lockDeliveryEbol(ready, { ...signed, stopVisit: deliveryVisit }, at)
  expect(delivery.delivery).toMatchObject({ lockedAt: at, stopVisit: deliveryVisit })
  expect(delivery.delivery.verification).toBeUndefined()
  expect(readLabelActivity('scan', context)).toEqual(check)
})
