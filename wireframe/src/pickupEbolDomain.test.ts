import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { canLockPickupEbol, createOrderEbol, lockPickupEbol, type PickupEbolConfirmationInput } from './orderEbolDomain'

const signedInput: PickupEbolConfirmationInput = {
  contactMethod: 'signed',
  contactName: 'Alex Morgan',
  contactlessReason: '',
  contactlessAcknowledged: false,
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

  it('requires a reason and acknowledgment for contactless confirmation', () => {
    expect(canLockPickupEbol({ ...signedInput, contactMethod: 'contactless', contactName: '', contactlessReason: '' })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, contactMethod: 'contactless', contactName: '', contactlessReason: 'Contact unavailable' })).toBe(false)
    expect(canLockPickupEbol({ ...signedInput, contactMethod: 'contactless', contactName: '', contactlessReason: 'Contact unavailable', contactlessAcknowledged: true })).toBe(true)
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
})
