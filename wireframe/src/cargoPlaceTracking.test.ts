import { describe, expect, it } from 'vitest'
import { expandCargoPlaces, initialCargoRecords } from './cargoDomain'
import { applyCargoPlaceTracking } from './cargoPlaceTracking'

describe('cargo place tracking', () => {
  it('projects a loaded place without changing its stable identity', () => {
    const place = expandCargoPlaces(initialCargoRecords[0])[0]
    const tracked = applyCargoPlaceTracking(place, {
      loadedPlaceKeys: [place.placeId],
      originWarehouse: 'NJ1',
      truck: 'Truck 1 · 26 ft',
    })

    expect(tracked.placeId).toBe(place.placeId)
    expect(tracked.status).toBe('loaded')
    expect(tracked.currentLocation).toBe('NJ1 · Truck 1 · 26 ft')
    expect(tracked.events.at(-1)?.title).toBe('Loaded on truck')
  })
})
