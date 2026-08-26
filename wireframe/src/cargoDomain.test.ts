import { describe, expect, it } from 'vitest'
import { calculatePieces, calculateVolume, defaultDimensionGroups, expandCargoPlaces, initialCargoRecords, normalizeOrderNumber } from './cargoDomain'

describe('cargo record calculations', () => {
  it('matches the accepted pickup example', () => {
    expect(calculatePieces(defaultDimensionGroups)).toBe(11)
    expect(calculateVolume(defaultDimensionGroups)).toBe(273.44)
  })

  it('normalizes order input', () => {
    expect(normalizeOrderNumber('#11155599')).toBe('11155599')
  })

  it('creates a stable CargoPlace lifecycle projection for every piece', () => {
    const first = expandCargoPlaces(initialCargoRecords[0])
    const second = expandCargoPlaces(initialCargoRecords[0])

    expect(second.map((place) => place.placeId)).toEqual(first.map((place) => place.placeId))
    expect(first[0]).toMatchObject({
      placeId: 'ZB-11155599-01',
      orderNumber: '11155599',
      placeNumber: 1,
      totalPlaces: 11,
      dimensions: '11 × 22 × 33 in',
      weightSource: 'allocated_from_order_total',
      label: 'Place 1/11 · Code 128',
      currentLocation: 'NJ1 · Pickup staging',
      status: 'ready_for_loading',
    })
    expect(first[0].events).toHaveLength(2)
  })
})
