import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import { createInterstateDirection, directionLabel, expandRecordPlaces, getEligibleRecords, interstateBolArchive, interstateIncomingTrips, searchInterstateBols, summarizeLoadedPlaces } from './interstateDomain'

describe('interstate loading rules', () => {
  it('uses only pickup records matching the selected interstate direction', () => {
    const records = getEligibleRecords(initialCargoRecords, 'NJ1_CA1')
    expect(records.map((record) => record.orderNumber)).toEqual(['11155599', '11098765', '11076543'])
  })

  it('builds directions from any configured warehouse pair', () => {
    const direction = createInterstateDirection('TX1', 'FL1')
    expect(directionLabel(direction)).toBe('TX1 → FL1')
    expect(getEligibleRecords(initialCargoRecords, direction)).toEqual([])
  })

  it('summarizes only selected places for partial loading', () => {
    const places = expandRecordPlaces(initialCargoRecords[0]).slice(0, 4)
    expect(summarizeLoadedPlaces(places).placeCount).toBe(4)
    expect(summarizeLoadedPlaces(places).orderCount).toBe(1)
  })

  it('unloads against the immutable loaded manifest', () => {
    const trip = interstateIncomingTrips[0]
    const summary = summarizeLoadedPlaces(trip.manifest)
    expect(summary).toEqual({
      orderCount: trip.orderCount,
      placeCount: trip.placeCount,
      loadedWeight: trip.loadedWeight,
      loadedVolume: trip.loadedVolume,
    })
    expect(new Set(trip.manifest.map((place) => place.key)).size).toBe(trip.placeCount)
  })

  it('finds BOLs by number, TripID and status', () => {
    expect(searchInterstateBols(interstateBolArchive, '000180')).toHaveLength(1)
    expect(searchInterstateBols(interstateBolArchive, 'NJ1-CA2')).toHaveLength(1)
    expect(searchInterstateBols(interstateBolArchive, '', 'closed')).toHaveLength(3)
  })
})
