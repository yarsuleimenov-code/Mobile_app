import { findOrderEbol, readOrderEbols } from './orderEbolStore'
import type { SpokeOperation, SpokeRoute, SpokeTask } from './spokeDomain'

export interface StopProgress {
  stopId: string
  order: string
  operation: SpokeOperation
  startedAt: string
  completedAt?: string
}

export const stopProgressEvent = 'zaberman-route-stop-progress'

export function stopProgressKey(route: SpokeRoute) {
  return `zaberman-route-stops:v1:${JSON.stringify([route.routeId, route.workDate])}`
}

export function readStopProgressSnapshot(key: string) {
  try { return localStorage.getItem(key) ?? '' }
  catch { return '' }
}

export function parseStopProgress(snapshot: string): StopProgress[] {
  try {
    const value: unknown = JSON.parse(snapshot)
    if (!Array.isArray(value)) return []
    return value.filter((item) => typeof item?.stopId === 'string'
      && typeof item.order === 'string' && (item.operation === 'pickup' || item.operation === 'dropoff')
      && typeof item.startedAt === 'string' && Number.isFinite(Date.parse(item.startedAt))
      && (item.completedAt === undefined || (typeof item.completedAt === 'string' && Number.isFinite(Date.parse(item.completedAt)))))
  } catch { return [] }
}

export function progressForStop(entries: StopProgress[], task: SpokeTask) {
  return entries.find((entry) => entry.stopId === task.stopId && entry.order === task.externalId && entry.operation === task.operation)
}

export function stopHandoff(task: SpokeTask) {
  const order = findOrderEbol(readOrderEbols(), task.externalId)
  return task.operation === 'pickup' ? order?.pickup : order?.delivery
}

export function hasStopConfirmation(task: SpokeTask, progress: StopProgress) {
  const handoff = stopHandoff(task)
  return Boolean(handoff?.lockedAt && handoff.verification?.stopId === task.stopId
    && handoff.verification.orderNumber === task.externalId && handoff.verification.operation === task.operation
    && Date.parse(handoff.verification.checkedAt) >= Date.parse(progress.startedAt))
}

export async function updateStopProgress(route: SpokeRoute, task: SpokeTask, action: 'start' | 'complete') {
  const key = stopProgressKey(route)
  const update = () => {
    const entries = parseStopProgress(localStorage.getItem(key) ?? '')
    const progress = progressForStop(entries, task)
    const now = new Date().toISOString()
    if (action === 'start') {
      if (progress) return
      if (entries.some((entry) => !entry.completedAt)) throw new Error('Complete the active stop before starting another.')
      if (stopHandoff(task)?.lockedAt) throw new Error('The handoff for this order is already confirmed.')
      entries.push({ stopId: task.stopId, order: task.externalId, operation: task.operation, startedAt: now })
    } else {
      if (progress?.completedAt) return
      if (!progress || !hasStopConfirmation(task, progress)) throw new Error('Confirm the handoff at this stop before completing it.')
      progress.completedAt = now
    }
    localStorage.setItem(key, JSON.stringify(entries))
    window.dispatchEvent(new Event(stopProgressEvent))
  }
  if (navigator.locks) await navigator.locks.request(key, update)
  else update()
}
