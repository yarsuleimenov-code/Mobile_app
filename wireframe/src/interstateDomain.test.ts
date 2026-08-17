import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { expandRecordPlaces, getEligibleRecords, interstateBolArchive, searchInterstateBols, summarizeLoadedPlaces } from './interstateDomain'

describe('interstate loading rules', () => {
  it('uses only pickup records matching the selected interstate direction', () => {
    const records = getEligibleRecords(initialCargoRecords, 'NJ1_CA1')
    expect(records.map((record) => record.orderNumber)).toEqual(['11155599', '11098765', '11076543'])
  })

  it('summarizes only selected places for partial loading', () => {
    const places = expandRecordPlaces(initialCargoRecords[0]).slice(0, 4)
    expect(summarizeLoadedPlaces(places).placeCount).toBe(4)
    expect(summarizeLoadedPlaces(places).orderCount).toBe(1)
  })

  it('finds BOLs by number, TripID and status', () => {
    expect(searchInterstateBols(interstateBolArchive, '000180')).toHaveLength(1)
    expect(searchInterstateBols(interstateBolArchive, 'NJ1-CA2')).toHaveLength(1)
    expect(searchInterstateBols(interstateBolArchive, '', 'closed')).toHaveLength(3)
  })
})
