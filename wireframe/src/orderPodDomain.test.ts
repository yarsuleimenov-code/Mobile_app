import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import {
  createOrderEbol, isOrderPodAvailable, lockDeliveryEbol, lockPickupEbol, prepareDeliveryEbol,
} from './orderEbolDomain'

const pickupInput = {
  contactMethod: 'signed' as const,
  contactName: 'Alex Morgan',
  contactlessReason: '',
  contactlessAcknowledged: false,
  driverName: 'John Doe',
  hasDamage: false,
  exceptionNote: '',
}

describe('Order eBOL POD availability', () => {
  it('is unavailable until both handoff snapshots are locked', () => {
    const draft = createOrderEbol(initialCargoRecords[0])
    const pickup = lockPickupEbol(draft, pickupInput)
    const deliveryReview = prepareDeliveryEbol(pickup, initialCargoRecords[0], {
      photoCount: 2,
      hasDamage: false,
      exceptionNote: '',
    })

    expect(isOrderPodAvailable(draft)).toBe(false)
    expect(isOrderPodAvailable(pickup)).toBe(false)
    expect(isOrderPodAvailable(deliveryReview)).toBe(false)
  })

  it('is available from the completed Order eBOL without a separate POD lifecycle', () => {
    const pickup = lockPickupEbol(createOrderEbol(initialCargoRecords[0]), pickupInput)
    const deliveryReview = prepareDeliveryEbol(pickup, initialCargoRecords[0], {
      photoCount: 2,
      hasDamage: true,
      exceptionNote: 'Corner dent documented',
    })
    const completed = lockDeliveryEbol(deliveryReview, {
      ...pickupInput,
      contactName: 'Taylor Reed',
      hasDamage: true,
      exceptionNote: 'Corner dent documented',
    })

    expect(completed.status).toBe('completed')
    expect(isOrderPodAvailable(completed)).toBe(true)
  })
})
