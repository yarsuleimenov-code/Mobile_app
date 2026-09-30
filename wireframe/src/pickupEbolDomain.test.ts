import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { canLockPickupEbol, createOrderEbol, lockPickupEbol, lockSupplementalPickup, prepareSupplementalPickup, type PickupEbolConfirmationInput } from './orderEbolDomain'

const signedInput: PickupEbolConfirmationInput = {
  contactMethod: 'signed',
  contactName: 'Alex Morgan',
  driverName: 'John Doe',
  hasDamage: false,
  exceptionNote: '',
}

describe('Pickup eBOL confirmation', () => {
  it('requires both parties and a documented damage exception', () => {
    expect(canLockPickupEbol({ ...signedInput, driverName: '' })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, hasDamage: true })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, hasDamage: true, exceptionNote: 'Scratch on left panel' })).toBe(true)
  })

  it('requires a verified OTP and the recipient phone suffix', () => {
    expect(canLockPickupEbol({ ...signedInput, contactMethod: 'otp', otpVerified: false, otpPhoneLast4: '0198' })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, contactMethod: 'otp', otpVerified: true, otpPhoneLast4: '' })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, contactMethod: 'otp', otpVerified: true, otpPhoneLast4: '0198' })).toBe(true)
  })

  it('locks the Pickup snapshot without changing Delivery', () => {
    const draft = createOrderEbol(initialCargoRecords[0], '2026-08-25T10:00:00.000Z')
    const locked = lockPickupEbol(draft, { ...signedInput, hasDamage: true, exceptionNote: ' Scratch on left panel ' }, '2026-08-25T10:05:00.000Z')

    expect(locked).toMatchObject({
      status: 'pickup_locked',
      pickup: {
        lockedAt: '2026-08-25T10:05:00.000Z',
        evidence: { hasDamage: true, exceptionNote: 'Scratch on left panel' },
        contact: { status: 'signed', signerName: 'Alex Morgan' },
        driver: { status: 'signed', signerName: 'John Doe' },
      },
    })
    expect(locked.delivery).toEqual(draft.delivery)
  })

  it('keeps email optional but requires a valid address when a signed contact requests a copy', () => {
    expect(canLockPickupEbol({ ...signedInput, sendEmailCopy: true })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, sendEmailCopy: true, contactEmail: 'wrong-address' })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, sendEmailCopy: true, contactEmail: ' contact@example.com ' })).toBe(true)
    expect(canLockPickupEbol({ ...signedInput, contactMethod: 'otp', otpVerified: true, otpPhoneLast4: '0198', sendEmailCopy: true, contactEmail: 'contact@example.com' })).toBe(false)
  })

  it('records the recipient only on the signed Pickup version that requested a copy', () => {
    const original = lockPickupEbol(createOrderEbol(initialCargoRecords[0]), {
      ...signedInput, sendEmailCopy: true, contactEmail: ' contact@example.com ',
    }, '2026-08-25T10:05:00.000Z')
    expect(original.pickup.contact.emailCopyRequest).toEqual({
      recipientEmail: 'contact@example.com', requestedAt: '2026-08-25T10:05:00.000Z',
    })
    const draft = prepareSupplementalPickup(original, {
      addedPlaceIds: ['ZB-EXTRA-01'], totalWeight: 18, totalVolume: 3, photoCount: 1, changeHistory: [],
    })
    const supplemental = lockSupplementalPickup(draft, 2, {
      ...signedInput, sendEmailCopy: true, contactEmail: 'other@example.com',
    }, '2026-08-25T11:00:00.000Z')
    expect(supplemental.pickup).toEqual(original.pickup)
    expect(supplemental.pickupSupplements[0].contact.emailCopyRequest?.recipientEmail).toBe('other@example.com')
  })
})
