import { findOrderEbol, readOrderEbols } from './orderEbolStore'
import type { SpokeOperation, SpokeRoute, SpokeTask } from './spokeDomain'

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
  return `zaberman-route-stops:v1:${JSON.stringify([route.routeId, route.workDate])}`
}

export function readStopProgressSnapshot(key: string) {
  try { return localStorage.getItem(key) ?? '' }
  catch { return '' }
}

export async function withRouteStopLock(route: SpokeRoute, update: () => void) {
  if (navigator.locks) await navigator.locks.request(stopProgressKey(route), update)
  else update()
}

export function parseStopProgress(snapshot: string): StopProgress[] {
  const isTimestamp = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))
  try {
    const value: unknown = JSON.parse(snapshot)
    if (!Array.isArray(value)) return []
    return value.filter((item) => typeof item?.stopId === 'string'
      && typeof item.order === 'string' && (item.operation === 'pickup' || item.operation === 'dropoff')
      && (item.startedAt === undefined || isTimestamp(item.startedAt))
      && (item.failure === undefined || (isTimestamp(item.failure?.at)
        && typeof item.failure.reason === 'string' && Boolean(item.failure.reason.trim())))
      && (item.startedAt !== undefined || item.failure !== undefined)
      && (item.completedAt === undefined || (isTimestamp(item.completedAt) && item.startedAt && !item.failure)))
  } catch { return [] }
}

export function progressForStop(entries: StopProgress[], task: SpokeTask) {
  return entries.find((entry) => entry.stopId === task.stopId && entry.order === task.externalId && entry.operation === task.operation)
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
  return Boolean(progress.startedAt && !progress.failure && handoff?.lockedAt && handoff.verification?.stopId === task.stopId
    && handoff.verification.orderNumber === task.externalId && handoff.verification.operation === task.operation
    && Date.parse(handoff.verification.checkedAt) >= Date.parse(progress.startedAt))
}

export async function updateStopProgress(route: SpokeRoute, task: SpokeTask, action: StopProgressAction, reason = '') {
  const key = stopProgressKey(route)
  const update = () => {
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
    localStorage.setItem(key, JSON.stringify(entries))
    window.dispatchEvent(new Event(stopProgressEvent))
  }
  await withRouteStopLock(route, update)
}
