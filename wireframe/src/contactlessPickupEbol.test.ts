import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { createOrderEbol, lockPickupEbol } from './orderEbolDomain'

describe('Contactless Pickup eBOL', () => {
  it('stores the skipped contact reason and the required driver confirmation', () => {
    const draft = createOrderEbol(initialCargoRecords[0], '2026-08-25T10:00:00.000Z')
    const locked = lockPickupEbol(draft, {
      contactMethod: 'contactless',
      contactName: '',
      contactlessReason: 'Contact unavailable',
      contactlessAcknowledged: true,
      driverName: 'John Doe',
      hasDamage: false,
      exceptionNote: '',
    }, '2026-08-25T10:10:00.000Z')

    expect(locked.pickup.contact).toEqual({
      status: 'contactless',
      contactlessReason: 'Contact unavailable',
      confirmedAt: '2026-08-25T10:10:00.000Z',
    })
    expect(locked.pickup.driver).toMatchObject({ status: 'signed', signerName: 'John Doe' })
    expect(locked.status).toBe('pickup_locked')
  })
})
