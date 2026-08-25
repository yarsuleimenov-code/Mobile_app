import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { createOrderEbol, lockDeliveryEbol, lockPickupEbol, prepareDeliveryEbol } from './orderEbolDomain'
import { getOrderDocumentNavigation } from './orderEbolNavigation'

const confirmation = {
  contactMethod: 'signed' as const,
  contactName: 'Alex Morgan',
  contactlessReason: '',
  contactlessAcknowledged: false,
  driverName: 'John Doe',
  hasDamage: false,
  exceptionNote: '',
}

describe('Order document navigation', () => {
  it('routes Pickup review and locked Pickup to the Order eBOL Pickup view', () => {
    const review = createOrderEbol(initialCargoRecords[0])
    const locked = lockPickupEbol(review, confirmation)

    expect(getOrderDocumentNavigation(review)).toMatchObject({ state: 'pickup_review', path: '/orders/11155599/ebol/pickup' })
    expect(getOrderDocumentNavigation(locked)).toMatchObject({ state: 'pickup_locked', path: '/orders/11155599/ebol/pickup' })
  })

  it('routes Delivery review to Delivery and completed eBOL to POD', () => {
    const pickup = lockPickupEbol(createOrderEbol(initialCargoRecords[0]), confirmation)
    const delivery = prepareDeliveryEbol(pickup, initialCargoRecords[0], { photoCount: 2, hasDamage: false, exceptionNote: '' })
    const completed = lockDeliveryEbol(delivery, { ...confirmation, contactName: 'Taylor Reed' })

    expect(getOrderDocumentNavigation(delivery)).toMatchObject({ state: 'delivery_review', path: '/orders/11155599/ebol/delivery' })
    expect(getOrderDocumentNavigation(completed)).toMatchObject({ state: 'pod_available', path: '/orders/11155599/ebol/pod', statusLabel: 'POD available' })
  })
})
