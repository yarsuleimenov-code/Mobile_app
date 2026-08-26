import type { CargoPlaceEvent, CargoPlaceStatus, OrderCargoPlace, Warehouse } from './cargoDomain'
import type { GeneratedInterstateTrip } from './interstateDomain'

export interface CargoPlaceTrackingContext {
  loadedPlaceKeys: string[]
  originWarehouse: Warehouse
  truck: string
  generatedTrip?: GeneratedInterstateTrip
}

export interface TrackedCargoPlace extends OrderCargoPlace {
  status: CargoPlaceStatus
}

export const cargoPlaceStatusLabels: Record<CargoPlaceStatus, string> = {
  ready_for_loading: 'Ready for loading',
  loaded: 'Loaded',
  in_transit: 'In transit',
  delivered: 'Delivered',
}

export const cargoPlaceWeightSourceLabels: Record<OrderCargoPlace['weightSource'], string> = {
  allocated_from_order_total: 'Allocated from Order total',
}

export function applyCargoPlaceTracking(place: OrderCargoPlace, context: CargoPlaceTrackingContext): TrackedCargoPlace {
  if (place.status === 'delivered' || !context.loadedPlaceKeys.includes(place.placeId)) return place

  const inTransit = Boolean(context.generatedTrip)
  const trackingEvent: CargoPlaceEvent = inTransit
    ? {
        id: `trip-${context.generatedTrip!.tripId}`,
        at: context.generatedTrip!.createdAt,
        title: 'Interstate trip created',
        detail: `${context.generatedTrip!.tripId} · ${context.truck}`,
      }
    : {
        id: 'loaded-current-session',
        at: 'Current session',
        title: 'Loaded on truck',
        detail: `${context.originWarehouse} · ${context.truck}`,
      }

  return {
    ...place,
    status: inTransit ? 'in_transit' : 'loaded',
    currentLocation: inTransit
      ? `${context.generatedTrip!.tripId} · ${context.truck}`
      : `${context.originWarehouse} · ${context.truck}`,
    events: [...place.events, trackingEvent],
  }
}
