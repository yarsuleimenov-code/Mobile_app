import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import {
  getEffectivePickupPlaceIds, isOrderPodAvailable, lockDeliveryEbol, lockPickupEbol,
  lockSupplementalPickup, prepareDeliveryEbol, prepareSupplementalPickup, syncPickupOrderEbolDraft,
} from './orderEbolDomain'
import { getOrderDocumentNavigation } from './orderEbolNavigation'

const signedPickup = {
  contactMethod: 'signed' as const,
  contactName: 'Alex Morgan',
  driverName: 'John Doe',
  hasDamage: false,
  exceptionNote: '',
}

describe('Order eBOL end-to-end scenarios', () => {
  it('syncs editable Pickup evidence but never overwrites a locked snapshot', () => {
    const record = initialCargoRecords[0]
    const draft = syncPickupOrderEbolDraft(undefined, record, '2026-08-25T10:00:00.000Z')
    const updatedRecord = { ...record, totalWeight: 456, photoCount: 5 }
    const synced = syncPickupOrderEbolDraft(draft, updatedRecord, '2026-08-25T10:03:00.000Z')

    expect(synced).toMatchObject({
      status: 'pickup_review',
      createdAt: '2026-08-25T10:00:00.000Z',
      updatedAt: '2026-08-25T10:03:00.000Z',
      pickup: { evidence: { totalWeight: 456, photoCount: 5 } },
    })

    const locked = lockPickupEbol(synced, signedPickup, '2026-08-25T10:05:00.000Z')
    expect(syncPickupOrderEbolDraft(locked, record, '2026-08-25T10:06:00.000Z')).toBe(locked)
  })

  it('completes the standard signed flow and routes the final document to POD', () => {
    const pickupDraft = syncPickupOrderEbolDraft(undefined, initialCargoRecords[0], '2026-08-25T10:00:00.000Z')
    const pickupLocked = lockPickupEbol(pickupDraft, signedPickup, '2026-08-25T10:05:00.000Z')
    const deliveryReview = prepareDeliveryEbol(pickupLocked, initialCargoRecords[0], {
      photoCount: 2,
      hasDamage: false,
      exceptionNote: '',
    }, '2026-08-25T11:00:00.000Z')
    const completed = lockDeliveryEbol(deliveryReview, {
      ...signedPickup,
      contactName: 'Taylor Reed',
    }, '2026-08-25T11:10:00.000Z')

    expect(completed.status).toBe('completed')
    expect([
      completed.pickup.contact.status,
      completed.pickup.driver.status,
      completed.delivery.contact.status,
      completed.delivery.driver.status,
    ]).toEqual(['signed', 'signed', 'signed', 'signed'])
    expect(isOrderPodAvailable(completed)).toBe(true)
    expect(getOrderDocumentNavigation(completed).path).toBe('/orders/11155599/ebol/pod')
  })

  it('completes OTP handoffs with documented damage and required driver signatures', () => {
    const draft = syncPickupOrderEbolDraft(undefined, initialCargoRecords[0])
    const pickupLocked = lockPickupEbol(draft, {
      ...signedPickup,
      contactMethod: 'otp',
      otpVerified: true,
      otpPhoneLast4: '0142',
      hasDamage: true,
      exceptionNote: 'Scratch documented at Pickup',
    })
    const deliveryReview = prepareDeliveryEbol(pickupLocked, initialCargoRecords[0], {
      photoCount: 3,
      hasDamage: true,
      exceptionNote: 'Corner dent documented at Delivery',
    })
    const completed = lockDeliveryEbol(deliveryReview, {
      ...signedPickup,
      contactMethod: 'otp',
      otpVerified: true,
      otpPhoneLast4: '0198',
      hasDamage: true,
      exceptionNote: 'Corner dent documented at Delivery',
    })

    expect(completed.pickup).toMatchObject({
      evidence: { hasDamage: true, exceptionNote: 'Scratch documented at Pickup' },
      contact: { status: 'otp', otpPhoneLast4: '0142' },
      driver: { status: 'signed' },
    })
    expect(completed.delivery).toMatchObject({
      evidence: { hasDamage: true, exceptionNote: 'Corner dent documented at Delivery' },
      contact: { status: 'otp', otpPhoneLast4: '0198' },
      driver: { status: 'signed' },
    })
    expect(isOrderPodAvailable(completed)).toBe(true)
  })

  it('adds places through a separately signed version without mutating version 1', () => {
    const original = lockPickupEbol(
      syncPickupOrderEbolDraft(undefined, initialCargoRecords[0], '2026-09-01T10:00:00.000Z'),
      signedPickup,
      '2026-09-01T10:05:00.000Z',
    )
    const versionOne = structuredClone(original.pickup)
    const draft = prepareSupplementalPickup(original, {
      addedPlaceIds: ['ZB-11155599-12'],
      totalWeight: 18,
      totalVolume: 4.5,
      photoCount: 2,
      changeHistory: [],
    }, '2026-09-01T10:20:00.000Z')

    expect(getEffectivePickupPlaceIds(draft)).toHaveLength(11)
    const locked = lockSupplementalPickup(draft, 2, {
      ...signedPickup,
      contactName: 'Sam Customer',
      driverName: 'Maria Driver',
    }, '2026-09-01T10:25:00.000Z')

    expect(locked.pickup).toEqual(versionOne)
    expect(getEffectivePickupPlaceIds(locked)).toHaveLength(12)
    expect(locked.pickupSupplements[0]).toMatchObject({
      version: 2,
      documentNumber: '11155599-PU-2',
      status: 'locked',
      addedPlaceIds: ['ZB-11155599-12'],
      contact: { status: 'signed', signerName: 'Sam Customer' },
      driver: { status: 'signed', signerName: 'Maria Driver' },
    })
  })
})
