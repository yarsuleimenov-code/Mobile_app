import { describe, expect, it, vi, afterEach } from 'vitest'
import { approveHandoff, assertHandoffVerification, defaultVerificationPolicy, distanceMeters, verifyHandoff } from './handoffVerificationDomain'
import { captureHandoffLocation, type HandoffSettings } from './handoffVerificationStore'
import { initialCargoRecords } from './cargoDomain'
import { createOrderEbol, lockDeliveryEbol, lockPickupEbol, lockSupplementalPickup, prepareDeliveryEbol, prepareSupplementalPickup } from './orderEbolDomain'
import type { SpokeTask } from './spokeDomain'

const now = Date.parse('2026-11-03T10:00:00Z')
const target = { latitude: 42, longitude: -71 }
const task: SpokeTask = { stopId: 'pickup-stop', sequence: 1, externalId: '11155599', operation: 'pickup',
  address: 'Pickup address', title: 'Cargo', scheduledTime: '10:00 AM', coordinates: target }
const base = { orderNumber: '11155599', operation: 'pickup' as const, driver: 'John Doe', task, target,
  code: 'ZB-11155599-01', labels: [{ placeId: 'ZB-11155599-01', orderNumber: '11155599' }, { placeId: 'FOREIGN-LABEL', orderNumber: '222' }],
  fix: { ...target, accuracy: 5, capturedAt: now }, policy: defaultVerificationPolicy }
const signed = { contactMethod: 'signed' as const, contactName: 'Contact', driverName: 'John Doe', hasDamage: false, exceptionNote: '' }
const settings: HandoffSettings = { ...defaultVerificationPolicy, scenario: 'device', qrScenario: 'matched' }
afterEach(() => vi.unstubAllGlobals())

describe('QR and location verification', () => {
  it('checks a known label without case/whitespace sensitivity', () => {
    const check = verifyHandoff({ ...base, code: ' zb-11155599-01 ' }, now)
    expect(approveHandoff(check)).toMatchObject({ qr: 'matched', location: 'passed', overridden: false, reason: '' })
  })
  it('warns for another order without changing active order or operation', () => {
    const check = verifyHandoff({ ...base, code: 'FOREIGN-LABEL' }, now)
    expect(check).toMatchObject({ orderNumber: '11155599', scannedOrder: '222', operation: 'pickup', qr: 'wrong_order' })
    expect(() => approveHandoff(check, '   ')).toThrow('reason')
    expect(approveHandoff(check, ' Dispatcher approved ')).toMatchObject({ overridden: true, reason: 'Dispatcher approved' })
  })
  it.each(['ZB-11155599-99', '11155599', 'https://unknown.example/11155599', ''])('does not infer an order from unknown payload %s', (code) => {
    const check = verifyHandoff({ ...base, code }, now)
    expect(check.qr).toBe('unknown')
    expect(() => approveHandoff(check, 'Any reason')).toThrow('not recognized')
  })
  it('checks distances in meters and respects a changed radius', () => {
    expect(distanceMeters(target, target)).toBe(0)
    expect(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111195, 0)
    const fix = { ...base.fix, latitude: 42.002 }
    const check = verifyHandoff({ ...base, fix }, now)
    expect(check.distance).toBeGreaterThan(220)
    expect(check.location).toBe('outside')
    expect(() => approveHandoff(check)).toThrow('reason')
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
  it('requires a reason for missing coordinates instead of reporting success', () => {
    const check = verifyHandoff({ ...base, target: undefined }, now)
    expect(check.location).toBe('missing_coordinates')
    expect(check.distance).toBeUndefined()
    expect(() => approveHandoff(check)).toThrow('reason')
  })
  it('rejects old checks and checks belonging to another operation, driver or order', () => {
    const check = approveHandoff(verifyHandoff(base, now))
    for (const args of [
      ['11155599', 'pickup', 'John Doe', now + 30001], ['222', 'pickup', 'John Doe', now],
      ['11155599', 'dropoff', 'John Doe', now], ['11155599', 'pickup', 'Other driver', now],
    ] as const) expect(() => assertHandoffVerification(check, args[0], args[1], args[2], new Date(args[3]).toISOString())).toThrow('Repeat')
  })
})

describe('fresh location acquisition', () => {
  it('requests uncached high-accuracy coordinates each time', async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback, _failure?: PositionErrorCallback, _options?: PositionOptions) => success({ coords: { ...target, accuracy: 8 }, timestamp: now } as GeolocationPosition))
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
    await captureHandoffLocation(task, settings)
    await captureHandoffLocation(task, settings)
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
    expect(getCurrentPosition.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
  })
  it('handles permission denial and missing API', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (_: unknown, error: (value: { code: number }) => void) => error({ code: 1 }) } })
    expect(await captureHandoffLocation(task, settings)).toMatchObject({ error: 'denied' })
    vi.stubGlobal('navigator', {})
    expect(await captureHandoffLocation(task, settings)).toMatchObject({ error: 'unavailable' })
  })
  it('never supplies synthetic target coordinates in Device mode', async () => {
    vi.stubGlobal('navigator', {})
    expect((await captureHandoffLocation({ ...task, coordinates: undefined }, settings)).target).toBeUndefined()
    expect((await captureHandoffLocation(task, { ...settings, scenario: 'near' })).target).toEqual(target)
  })
})

describe('verification audit in signed versions', () => {
  it('stores success for Pickup and an override only for its own Delivery snapshot', () => {
    const verification = approveHandoff(verifyHandoff(base, now))
    const pickup = lockPickupEbol(createOrderEbol(initialCargoRecords[0]), { ...signed, verification }, new Date(now).toISOString())
    const deliveryCheck = approveHandoff(verifyHandoff({ ...base, operation: 'dropoff', code: 'FOREIGN-LABEL' }, now + 1000), 'Customer confirmed with dispatcher')
    const ready = prepareDeliveryEbol(pickup, initialCargoRecords[0], { photoCount: 1, hasDamage: false, exceptionNote: '' })
    const delivery = lockDeliveryEbol(ready, { ...signed, verification: deliveryCheck }, new Date(now + 1000).toISOString())
    expect(delivery.pickup.verification).toEqual(verification)
    expect(delivery.delivery.verification).toEqual(deliveryCheck)
    expect(delivery.delivery.verification?.reason).toBe('Customer confirmed with dispatcher')
    expect(delivery.delivery.verification?.fix).toEqual(base.fix)
  })
  it('keeps Supplemental verification separate from the original snapshot', () => {
    const verification = approveHandoff(verifyHandoff(base, now))
    const original = lockPickupEbol(createOrderEbol(initialCargoRecords[0]), { ...signed, verification }, new Date(now).toISOString())
    const draft = prepareSupplementalPickup(original, { addedPlaceIds: ['ZB-11155599-99'], totalWeight: 18, totalVolume: 3, photoCount: 1, changeHistory: [] })
    const check = approveHandoff(verifyHandoff({ ...base, target: undefined }, now), 'No coordinates for this address')
    const locked = lockSupplementalPickup(draft, 2, { ...signed, verification: check }, new Date(now).toISOString())
    expect(locked.pickup.verification).toEqual(verification)
    expect(locked.pickupSupplements[0].verification).toEqual(check)
  })
  it('rejects a warning without a reason at the lock boundary', () => {
    const verification = { ...verifyHandoff({ ...base, code: 'FOREIGN-LABEL' }, now), overridden: true }
    expect(() => lockPickupEbol(createOrderEbol(initialCargoRecords[0]), { ...signed, verification }, new Date(now).toISOString())).toThrow('reason')
  })
})
