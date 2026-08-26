import { useMemo } from 'react'
import { expandCargoPlaces, type OrderCargoPlace } from './cargoDomain'
import { applyCargoPlaceTracking } from './cargoPlaceTracking'
import { directionWarehouses, interstateIncomingTrips } from './interstateDomain'
import { useCargo } from './cargoStore'
import { useInterstate } from './interstateStore'

export function useTrackedCargoPlaces() {
  const { records } = useCargo()
  const { generatedTrip, loadedPlaceKeys, originWarehouse, truck, unloadingDrafts } = useInterstate()

  return useMemo(() => {
    const outgoing = records.flatMap(expandCargoPlaces).map((place) => applyCargoPlaceTracking(place, {
      generatedTrip, loadedPlaceKeys, originWarehouse, truck,
    }))
    const incoming = interstateIncomingTrips.flatMap((trip) => {
      const destination = directionWarehouses(trip.direction).destination
      const received = new Set(unloadingDrafts[trip.tripId] ?? [])
      return trip.manifest.map((place): OrderCargoPlace => {
        const inTransit = { ...place, currentLocation: `${trip.tripId} · ${trip.truck}` }
        return received.has(place.placeId) ? {
          ...inTransit,
          status: 'delivered',
          currentLocation: `${destination} · Receiving`,
          events: [...place.events, {
            id: `received-${trip.tripId}`,
            at: 'Current session',
            title: 'Received at destination',
            detail: `${destination} · ${trip.tripId}`,
          }],
        } : inTransit
      })
    })

    const uniquePlaces = new Map<string, OrderCargoPlace>()
    for (const place of [...outgoing, ...incoming]) uniquePlaces.set(place.placeId, place)
    return Array.from(uniquePlaces.values())
  }, [generatedTrip, loadedPlaceKeys, originWarehouse, records, truck, unloadingDrafts])
}
