import { findPlaceByCode } from './placeScanDomain'
import type { SpokeTask } from './spokeDomain'

export interface RouteLoadingStop extends SpokeTask {
  loadSource?: 'warehouse' | 'route_pickup'
  placeIds?: string[]
  packingPhotoSample?: boolean
}

export interface RouteLoadingPlan {
  routeId: string
  workDate: string
  name: string
  warehouse: string
  vehicle: string
  stops: RouteLoadingStop[]
}

export interface RouteLoadingSession {
  plan: RouteLoadingPlan
  loadedPlaceIds: string[]
  startedAt: string
  completedAt?: string
}

export type RouteLoadingAction =
  | { type: 'start' }
  | { type: 'complete' }
  | { type: 'scan'; code: string; knownPlace?: boolean }
  | { type: 'remove'; placeId: string }

export function warehouseLoadOrders(plan: RouteLoadingPlan) {
  return plan.stops.filter((stop) => stop.operation === 'dropoff' && stop.loadSource === 'warehouse')
}

export function expectedLoadPlaces(plan: RouteLoadingPlan) {
  return warehouseLoadOrders(plan).flatMap((stop) =>
    (stop.placeIds ?? []).map((placeId) => ({ placeId, order: stop.externalId })))
}

export function routeLoadingIssue(plan: RouteLoadingPlan) {
  const deliveries = plan.stops.filter((stop) => stop.operation === 'dropoff')
  const unassigned = deliveries.find((stop) => !stop.loadSource)
  if (unassigned) return `Loading source is missing for order #${unassigned.externalId}.`
  const orders = warehouseLoadOrders(plan)
  if (!orders.length) return 'No Delivery orders are planned for loading at this warehouse.'
  const missing = orders.find((stop) => !stop.placeIds?.length || stop.placeIds.some((id) => !id || id !== id.trim()))
  if (missing) return `The place list is missing for order #${missing.externalId}. Contact dispatch.`
  const ids = expectedLoadPlaces(plan).map(({ placeId }) => placeId.trim().toUpperCase())
  if (new Set(ids).size !== ids.length) return 'The place list contains a duplicate label. Contact dispatch.'
}

export function canCompleteRouteLoading(session: RouteLoadingSession) {
  if (session.completedAt || routeLoadingIssue(session.plan)) return false
  const loaded = new Set(session.loadedPlaceIds)
  return expectedLoadPlaces(session.plan).every(({ placeId }) => loaded.has(placeId))
}

export function updateRouteLoading(plan: RouteLoadingPlan, session: RouteLoadingSession | undefined, action: RouteLoadingAction, now: string): RouteLoadingSession {
  if (action.type === 'start') {
    if (session) return session
    const issue = routeLoadingIssue(plan)
    if (issue) throw new Error(issue)
    return { plan: structuredClone(plan), loadedPlaceIds: [], startedAt: now }
  }
  if (!session) throw new Error('Start loading before recording places.')
  if (session.completedAt) {
    if (action.type === 'complete') return session
    throw new Error('This load is already complete.')
  }
  if (action.type === 'complete') {
    if (!canCompleteRouteLoading(session)) throw new Error('Scan every remaining place before completing the load.')
    return { ...session, completedAt: now }
  }
  if (action.type === 'remove') {
    return { ...session, loadedPlaceIds: session.loadedPlaceIds.filter((id) => id !== action.placeId) }
  }
  const place = findPlaceByCode(expectedLoadPlaces(session.plan), action.code)
  if (!place) throw new Error(action.knownPlace ? 'This place belongs to another load.' : 'Label not found in this load. Check the PlaceID.')
  if (session.loadedPlaceIds.includes(place.placeId)) throw new Error(`${place.placeId} is already loaded.`)
  return { ...session, loadedPlaceIds: [...session.loadedPlaceIds, place.placeId] }
}
