import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { createPlaceLabels } from './placeLabelsDomain'

describe('place label generation', () => {
  it('creates one stable label for every Pickup piece', () => {
    const labels = createPlaceLabels(initialCargoRecords[0])

    expect(labels).toHaveLength(11)
    expect(new Set(labels.map((label) => label.placeId)).size).toBe(11)
    expect(labels[0]).toMatchObject({
      placeId: 'ZB-11155599-01',
      placeNumber: 1,
      totalPlaces: 11,
      route: 'NJ1 → CA1',
      dimensions: '11 × 22 × 33 in',
    })
    expect(labels.at(-1)).toMatchObject({
      placeId: 'ZB-11155599-11',
      placeNumber: 11,
      dimensions: '11 × 11 × 11 in',
    })
  })

  it('keeps the same Place IDs when labels are generated again', () => {
    const firstPrint = createPlaceLabels(initialCargoRecords[0]).map((label) => label.placeId)
    const reprint = createPlaceLabels(initialCargoRecords[0]).map((label) => label.placeId)

    expect(reprint).toEqual(firstPrint)
  })
})
