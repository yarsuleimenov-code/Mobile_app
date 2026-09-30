import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { createOrderEbol, lockPickupEbol } from './orderEbolDomain'

describe('Pickup eBOL OTP confirmation', () => {
  it('stores the verified phone suffix and the required driver confirmation', () => {
    const draft = createOrderEbol(initialCargoRecords[0], '2026-08-25T10:00:00.000Z')
    const locked = lockPickupEbol(draft, {
      contactMethod: 'otp',
      contactName: 'Alex Morgan',
      otpVerified: true,
      otpPhoneLast4: '0198',
      driverName: 'John Doe',
      hasDamage: false,
      exceptionNote: '',
    }, '2026-08-25T10:10:00.000Z')

    expect(locked.pickup.contact).toEqual({
      status: 'otp',
      signerName: 'Alex Morgan',
      otpPhoneLast4: '0198',
      confirmedAt: '2026-08-25T10:10:00.000Z',
    })
    expect(locked.pickup.driver).toMatchObject({ status: 'signed', signerName: 'John Doe' })
    expect(locked.status).toBe('pickup_locked')
  })
})
