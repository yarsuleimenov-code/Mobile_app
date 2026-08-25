import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { createOrderEbol } from './orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from './orderEbolStore'

function createMemoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('Order eBOL model', () => {
  it('creates a pickup review snapshot with four pending confirmations', () => {
    const orderEbol = createOrderEbol(initialCargoRecords[0], '2026-08-25T10:00:00.000Z')

    expect(orderEbol.status).toBe('pickup_review')
    expect(orderEbol.pickup.evidence).toMatchObject({
      pieceCount: 11,
      placeIds: [
        'ZB-11155599-01', 'ZB-11155599-02', 'ZB-11155599-03', 'ZB-11155599-04',
        'ZB-11155599-05', 'ZB-11155599-06', 'ZB-11155599-07', 'ZB-11155599-08',
        'ZB-11155599-09', 'ZB-11155599-10', 'ZB-11155599-11',
      ],
      totalWeight: 123,
      totalVolume: 273.44,
      photoCount: 4,
      hasDamage: false,
    })
    expect([
      orderEbol.pickup.contact.status,
      orderEbol.pickup.driver.status,
      orderEbol.delivery.contact.status,
      orderEbol.delivery.driver.status,
    ]).toEqual(['pending', 'pending', 'pending', 'pending'])
  })

  it('keeps one Order eBOL per normalized order number', () => {
    const original = createOrderEbol(initialCargoRecords[0], '2026-08-25T10:00:00.000Z')
    const updated = { ...original, orderNumber: '#11155599', status: 'pickup_locked' as const }
    const orderEbols = upsertOrderEbol([original], updated)

    expect(orderEbols).toHaveLength(1)
    expect(findOrderEbol(orderEbols, '#11155599')).toMatchObject({
      orderNumber: '11155599',
      status: 'pickup_locked',
    })
  })

  it('persists the versioned mock state and safely handles invalid data', () => {
    const storage = createMemoryStorage()
    const orderEbol = createOrderEbol(initialCargoRecords[0], '2026-08-25T10:00:00.000Z')

    expect(writeOrderEbols([orderEbol], storage)).toBe(true)
    expect(readOrderEbols(storage)).toEqual([orderEbol])

    storage.setItem('zaberman-order-ebols:v1', '{invalid')
    expect(readOrderEbols(storage)).toEqual([])
  })
})
