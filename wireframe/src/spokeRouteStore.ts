import { refreshDemoRoute, type SpokeRoute } from './spokeDomain'

export const SPOKE_ROUTE_STORAGE_KEY = 'zaberman-spoke-route:v1'

export function readSpokeRoute() {
  try {
    const stored = localStorage.getItem(SPOKE_ROUTE_STORAGE_KEY)
    return stored ? refreshDemoRoute(JSON.parse(stored) as SpokeRoute) : undefined
  } catch { return undefined }
}

export function routeForVehicleCycle(route: SpokeRoute | undefined, preTripCompletedAt: string | null) {
  return route && (!route.runId || route.runId === preTripCompletedAt) ? route : undefined
}
