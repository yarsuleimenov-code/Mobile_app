import { expectedLoadPlaces, updateRouteLoading, type RouteLoadingAction, type RouteLoadingPlan, type RouteLoadingSession } from './routeLoadingDomain'
import { saveWorkflowChange } from './syncQueueStore'

const loadingEvent = 'zaberman-route-loading'

function storageKey(plan: RouteLoadingPlan) {
  return `zaberman-route-loading:v1:${JSON.stringify([plan.routeId, plan.workDate, plan.warehouse, plan.vehicle])}`
}

export function routeLoadingSnapshot(plan: RouteLoadingPlan) {
  try { return localStorage.getItem(storageKey(plan)) ?? '' }
  catch { return '' }
}

export function readRouteLoadingSession(plan: RouteLoadingPlan, snapshot = routeLoadingSnapshot(plan)): RouteLoadingSession | undefined {
  try {
    const session = JSON.parse(snapshot) as RouteLoadingSession
    if (!session || storageKey(session.plan) !== storageKey(plan) || !Array.isArray(session.plan.stops)
      || !Array.isArray(session.loadedPlaceIds) || typeof session.startedAt !== 'string') return undefined
    const expected = new Set(expectedLoadPlaces(session.plan).map(({ placeId }) => placeId))
    const loadedPlaceIds = [...new Set(session.loadedPlaceIds.filter((id) => expected.has(id)))]
    return { ...session, loadedPlaceIds }
  } catch { return undefined }
}

export function subscribeToRouteLoading(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(loadingEvent, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(loadingEvent, listener)
  }
}

export async function saveRouteLoadingAction(plan: RouteLoadingPlan, action: RouteLoadingAction) {
  const key = storageKey(plan)
  const save = () => {
    const current = readRouteLoadingSession(plan, localStorage.getItem(key) ?? '')
    const next = updateRouteLoading(plan, current, action, new Date().toISOString())
    if (next !== current) {
      if (next.completedAt && !current?.completedAt) {
        saveWorkflowChange(key, next, {
          id: key, label: 'Route Loading completed', detail: `${plan.warehouse} · ${plan.workDate} · ${next.loadedPlaceIds.length} places`,
          recordedAt: next.completedAt,
        })
      } else localStorage.setItem(key, JSON.stringify(next))
      window.dispatchEvent(new Event(loadingEvent))
    }
    return next
  }
  return navigator.locks ? navigator.locks.request(key, save) : save()
}
