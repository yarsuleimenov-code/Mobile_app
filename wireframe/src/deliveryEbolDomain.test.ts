import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import {
  canLockDeliveryEbol, createOrderEbol, lockDeliveryEbol, lockPickupEbol, prepareDeliveryEbol,
  type DeliveryEbolConfirmationInput,
} from './orderEbolDomain'

const signedInput: DeliveryEbolConfirmationInput = {
  contactMethod: 'signed',
  contactName: 'Taylor Reed',
  driverName: 'John Doe',
  hasDamage: false,
  exceptionNote: '',
}

function lockedPickup() {
  const draft = createOrderEbol(initialCargoRecords[0], '2026-08-25T10:00:00.000Z')
  return lockPickupEbol(draft, {
    contactMethod: 'signed',
    contactName: 'Alex Morgan',
    driverName: 'John Doe',
    hasDamage: false,
    exceptionNote: '',
  }, '2026-08-25T10:05:00.000Z')
}

describe('Delivery eBOL confirmation', () => {
  it('requires a locked Pickup snapshot before Delivery evidence', () => {
    const draft = createOrderEbol(initialCargoRecords[0])
    expect(() => prepareDeliveryEbol(draft, initialCargoRecords[0], {
      photoCount: 2,
      hasDamage: false,
      exceptionNote: '',
    })).toThrow('Pickup eBOL must be locked')
  })

  it('creates Delivery review evidence without changing locked Pickup', () => {
    const pickup = lockedPickup()
    const delivery = prepareDeliveryEbol(pickup, initialCargoRecords[0], {
      photoCount: 3,
      hasDamage: true,
      exceptionNote: ' Corner dent documented ',
    }, '2026-08-25T11:00:00.000Z')

    expect(delivery.status).toBe('delivery_review')
    expect(delivery.delivery.evidence).toMatchObject({
      capturedAt: '2026-08-25T11:00:00.000Z',
      photoCount: 3,
      hasDamage: true,
      exceptionNote: 'Corner dent documented',
    })
    expect(delivery.pickup).toEqual(pickup.pickup)
  })

  it('requires verified OTP and locks the completed Order eBOL', () => {
    const delivery = prepareDeliveryEbol(lockedPickup(), initialCargoRecords[0], {
      photoCount: 2,
      hasDamage: false,
      exceptionNote: '',
    })
    const otp = {
      ...signedInput,
      contactMethod: 'otp' as const,
      otpPhoneLast4: '0198',
    }

    expect(canLockDeliveryEbol(otp)).toBe(false)
    const completed = lockDeliveryEbol(delivery, {
      ...otp,
      otpVerified: true,
    }, '2026-08-25T11:10:00.000Z')

    expect(completed).toMatchObject({
      status: 'completed',
      delivery: {
        lockedAt: '2026-08-25T11:10:00.000Z',
        contact: { status: 'otp', otpPhoneLast4: '0198' },
        driver: { status: 'signed', signerName: 'John Doe' },
      },
    })
  })

  it('requires a verified OTP and records only the masked recipient reference', () => {
    const delivery = prepareDeliveryEbol(lockedPickup(), initialCargoRecords[0], {
      photoCount: 2,
      hasDamage: false,
      exceptionNote: '',
    })
    const otpInput: DeliveryEbolConfirmationInput = {
      ...signedInput,
      contactMethod: 'otp',
      contactName: 'Michael Reed',
      otpPhoneLast4: '0198',
      otpVerified: false,
    }
    expect(canLockDeliveryEbol(otpInput)).toBe(false)
    const completed = lockDeliveryEbol(delivery, { ...otpInput, otpVerified: true })
    expect(completed.delivery.contact).toMatchObject({
      status: 'otp', signerName: 'Michael Reed', otpPhoneLast4: '0198',
    })
  })
})
