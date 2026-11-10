import { findOrderEbol, readOrderEbols } from './orderEbolStore'
import type { SpokeOperation, SpokeRoute, SpokeTask } from './spokeDomain'
import { readSpokeRoute } from './spokeRouteStore'
import { saveWorkflowChange } from './syncQueueStore'

export interface StopProgress {
  stopId: string
  order: string
  operation: SpokeOperation
  startedAt?: string
  completedAt?: string
  failure?: { at: string; reason: string }
}

export type StopProgressAction = 'start' | 'complete' | 'fail' | 'undo'

export const stopProgressEvent = 'zaberman-route-stop-progress'

export function stopProgressKey(route: SpokeRoute) {
  const identity = route.runId ? [route.routeId, route.workDate, route.runId] : [route.routeId, route.workDate]
  return `zaberman-route-stops:v1:${JSON.stringify(identity)}`
}

function routeCompletionKey(route: SpokeRoute) {
  return stopProgressKey(route).replace('route-stops:', 'route-completion:')
}

export interface RouteCompletion {
  lastStopAt: string
  completedAt: string
}

export function readStopProgressSnapshot(key: string) {
  try { return localStorage.getItem(key) ?? '' }
  catch { return '' }
}

export function readRouteCompletionSnapshot(route: SpokeRoute) {
  return readStopProgressSnapshot(routeCompletionKey(route))
}

export function parseRouteCompletion(snapshot: string): RouteCompletion | undefined {
  try {
    const value = JSON.parse(snapshot) as RouteCompletion
    if (typeof value?.lastStopAt === 'string' && typeof value.completedAt === 'string'
      && Date.parse(value.completedAt) >= Date.parse(value.lastStopAt)) return value
  } catch { /* Missing or invalid data has no recorded completion. */ }
}

export function readRouteCompletion(route: SpokeRoute) {
  return parseRouteCompletion(readRouteCompletionSnapshot(route))
}

export async function withRouteStopLock(route: SpokeRoute, update: () => void) {
  if (navigator.locks) await navigator.locks.request(stopProgressKey(route), update)
  else update()
}

export function parseStopProgress(snapshot: string): StopProgress[] {
  const isTimestamp = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))
  try {
    const value = JSON.parse(snapshot)
    const entries = Array.isArray(value) ? value : value?.entries
    if (!Array.isArray(entries)) return []
    return entries.filter((item) => typeof item?.stopId === 'string'
      && typeof item.order === 'string' && (item.operation === 'pickup' || item.operation === 'dropoff')
      && (item.startedAt === undefined || isTimestamp(item.startedAt))
      && (item.failure === undefined || (isTimestamp(item.failure?.at)
        && typeof item.failure.reason === 'string' && Boolean(item.failure.reason.trim())))
      && (item.startedAt !== undefined || item.failure !== undefined)
      && (item.completedAt === undefined || (isTimestamp(item.completedAt) && item.startedAt && !item.failure)))
  } catch { return [] }
}

export function routeHasWork(snapshot: string) {
  try {
    const value = JSON.parse(snapshot)
    return value?.hasWork === true || parseStopProgress(snapshot).length > 0
  } catch { return false }
}

export function progressForStop(entries: StopProgress[], task: SpokeTask) {
  return entries.find((entry) => entry.stopId === task.stopId && entry.order === task.externalId && entry.operation === task.operation)
}

export function summarizeRouteStops(route: SpokeRoute, entries: StopProgress[]) {
  const remaining: SpokeTask[] = []
  const failed: Array<{ task: SpokeTask; reason: string }> = []
  let lastStopAt: string | undefined
  for (const task of route.tasks) {
    const progress = progressForStop(entries, task)
    const endedAt = progress?.completedAt ?? progress?.failure?.at
    if (!endedAt) remaining.push(task)
    else if (!lastStopAt || Date.parse(endedAt) > Date.parse(lastStopAt)) lastStopAt = endedAt
    if (progress?.failure) failed.push({ task, reason: progress.failure.reason })
  }
  return { remaining, failed, lastStopAt, completed: route.tasks.length - remaining.length - failed.length }
}

export function assertCurrentRoute(route: SpokeRoute) {
  const loaded = readSpokeRoute()
  if (!loaded || stopProgressKey(loaded) !== stopProgressKey(route)) throw new Error('Open the current route from Home.')
  return loaded
}

export async function completeSpokeRoute(route: SpokeRoute) {
  await withRouteStopLock(route, () => {
    const loaded = assertCurrentRoute(route)
    if (readRouteCompletion(route)) return
    const entries = parseStopProgress(localStorage.getItem(stopProgressKey(route)) ?? '')
    const { remaining, lastStopAt } = summarizeRouteStops(loaded, entries)
    if (remaining.length || !lastStopAt) throw new Error('Resolve all stops before completing the route.')
    const completedAt = new Date().toISOString()
    if (Date.parse(completedAt) < Date.parse(lastStopAt)) throw new Error('Check the device time and try again.')
    const key = routeCompletionKey(route)
    saveWorkflowChange(key, { lastStopAt, completedAt }, {
      id: key, label: 'Warehouse return', detail: `Route ${route.routeId}`, recordedAt: completedAt,
    })
    window.dispatchEvent(new Event(stopProgressEvent))
  })
}

export function isActiveStop(progress: StopProgress | undefined) {
  return Boolean(progress?.startedAt && !progress.completedAt && !progress.failure)
}

export function stopProgressLabel(progress: StopProgress) {
  if (progress.failure) return 'Failed'
  return progress.completedAt ? 'Completed' : 'In progress'
}

export function stopHandoff(task: SpokeTask) {
  const order = findOrderEbol(readOrderEbols(), task.externalId)
  return task.operation === 'pickup' ? order?.pickup : order?.delivery
}

export function hasStopConfirmation(task: SpokeTask, progress: StopProgress) {
  const handoff = stopHandoff(task)
  if (!progress.startedAt || progress.failure || !handoff?.lockedAt) return false
  if (handoff.stopVisit) return handoff.stopVisit.stopId === task.stopId && handoff.stopVisit.startedAt === progress.startedAt
    && Date.parse(handoff.lockedAt) >= Date.parse(progress.startedAt)
  if (handoff.verification) return Boolean(handoff.verification.stopId === task.stopId
    && handoff.verification.orderNumber === task.externalId && handoff.verification.operation === task.operation
    && Date.parse(handoff.verification.checkedAt) >= Date.parse(progress.startedAt))
  // Older manual signing links omitted the visit. Accept only a new signature for one unambiguous stop.
  const matching = readSpokeRoute()?.tasks.filter((item) => item.externalId === task.externalId && item.operation === task.operation)
  return matching?.length === 1 && matching[0].stopId === task.stopId
    && Date.parse(handoff.lockedAt) >= Date.parse(progress.startedAt)
}

export async function updateStopProgress(route: SpokeRoute, task: SpokeTask, action: StopProgressAction, reason = '') {
  const key = stopProgressKey(route)
  const update = () => {
    const loaded = assertCurrentRoute(route)
    if (!loaded.tasks.some((item) => item.stopId === task.stopId && item.externalId === task.externalId && item.operation === task.operation)) {
      throw new Error('This stop is unavailable on the current route.')
    }
    if (readRouteCompletion(route)) throw new Error('This route has already been completed.')
    const entries = parseStopProgress(localStorage.getItem(key) ?? '')
    const progress = progressForStop(entries, task)
    const now = new Date().toISOString()
    const newEntry = { stopId: task.stopId, order: task.externalId, operation: task.operation }
    switch (action) {
      case 'start':
        if (progress?.failure) throw new Error('Undo the failed status before starting this stop.')
        if (progress) return
        if (entries.some(isActiveStop)) throw new Error('Complete the active stop before starting another.')
        if (stopHandoff(task)?.lockedAt) throw new Error('The handoff for this order is already confirmed.')
        entries.push({ ...newEntry, startedAt: now })
        break
      case 'complete':
        if (progress?.completedAt) return
        if (!progress || !hasStopConfirmation(task, progress)) throw new Error('Confirm the handoff at this stop before completing it.')
        progress.completedAt = now
        break
      case 'fail': {
        if (progress?.completedAt || stopHandoff(task)?.lockedAt) throw new Error('The handoff for this order is already confirmed.')
        if (progress?.failure) return
        const failureReason = reason.trim()
        if (!failureReason) throw new Error('Enter a reason for the failed stop.')
        const failure = { at: now, reason: failureReason }
        if (progress) progress.failure = failure
        else entries.push({ ...newEntry, failure })
        break
      }
      case 'undo':
        if (!progress?.failure) return
        entries.splice(entries.indexOf(progress), 1)
        break
    }
    const next = { entries, hasWork: true }
    if (action === 'start') localStorage.setItem(key, JSON.stringify(next))
    else {
      const visit = task.operation === 'pickup' ? 'Pickup' : 'Delivery'
      const detail = action === 'fail' ? `Failed · ${reason.trim()}` : action === 'undo' ? 'Failure undone · Ready' : 'Stop completed'
      saveWorkflowChange(key, next, {
        id: `${key}:${JSON.stringify([task.stopId, task.externalId, task.operation])}`,
        label: `${visit} stop #${task.externalId}`, detail, recordedAt: now,
      })
    }
    window.dispatchEvent(new Event(stopProgressEvent))
  }
  await withRouteStopLock(route, update)
}
