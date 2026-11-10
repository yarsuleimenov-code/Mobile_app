import { afterEach, expect, it, vi } from 'vitest'
import { ORDER_EBOLS_STORAGE_KEY } from './orderEbolStore'
import { EVIDENCE_QUEUE_KEY, readEvidenceQueue } from './photoEvidenceDomain'
import { mockTodaySpokeRoute } from './spokeDomain'
import { completeSpokeRoute, hasStopConfirmation, isActiveStop, parseStopProgress, progressForStop, readRouteCompletion, routeHasWork, stopProgressKey, summarizeRouteStops, updateStopProgress } from './routeStopProgress'
import { SPOKE_ROUTE_STORAGE_KEY } from './spokeRouteStore'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function mockStorage() {
  const storage = new Map([[SPOKE_ROUTE_STORAGE_KEY, JSON.stringify(mockTodaySpokeRoute)]])
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('window', { dispatchEvent: vi.fn() })
  vi.useFakeTimers()
  return storage
}

it('releases the active stop only after its own new handoff and explicit completion', async () => {
  const storage = mockStorage()
  const route = mockTodaySpokeRoute
  const [pickup, delivery] = route.tasks
  const startedAt = '2026-11-06T12:00:00.000Z'
  const confirmedAt = '2026-11-06T12:10:00.000Z'
  const completedAt = '2026-11-06T12:15:00.000Z'
  const progress = () => parseStopProgress(storage.get(stopProgressKey(route)) ?? '')
  const setHandoff = (stopId: string, checkedAt: string) => storage.set(ORDER_EBOLS_STORAGE_KEY, JSON.stringify([{
    orderNumber: pickup.externalId, status: 'pickup_locked',
    pickup: { lockedAt: confirmedAt, verification: { orderNumber: pickup.externalId, operation: 'pickup', stopId, checkedAt } },
    delivery: {},
  }]))

  vi.setSystemTime(new Date(startedAt))
  await updateStopProgress(route, pickup, 'start')
  await updateStopProgress(route, pickup, 'start')
  await expect(updateStopProgress(route, delivery, 'start')).rejects.toThrow('Complete the active stop')
  await expect(updateStopProgress(route, pickup, 'complete')).rejects.toThrow('Confirm the handoff')
  vi.setSystemTime(new Date(completedAt))
  setHandoff('different-stop', confirmedAt)
  await expect(updateStopProgress(route, pickup, 'complete')).rejects.toThrow('Confirm the handoff')
  setHandoff(pickup.stopId, '2026-11-06T11:00:00.000Z')
  await expect(updateStopProgress(route, pickup, 'complete')).rejects.toThrow('Confirm the handoff')
  setHandoff(pickup.stopId, confirmedAt)
  expect(hasStopConfirmation(pickup, progress()[0]!)).toBe(true)
  const setVisit = (stopId: string, visitStartedAt: string) => storage.set(ORDER_EBOLS_STORAGE_KEY, JSON.stringify([{
    orderNumber: pickup.externalId, status: 'pickup_locked',
    pickup: { lockedAt: confirmedAt, stopVisit: { stopId, startedAt: visitStartedAt } },
    delivery: {},
  }]))
  setVisit('different-stop', startedAt)
  await expect(updateStopProgress(route, pickup, 'complete')).rejects.toThrow('Confirm the handoff')
  setVisit(pickup.stopId, '2026-11-06T11:00:00.000Z')
  await expect(updateStopProgress(route, pickup, 'complete')).rejects.toThrow('Confirm the handoff')
  setVisit(pickup.stopId, startedAt)
  await expect(updateStopProgress(route, delivery, 'start')).rejects.toThrow('Complete the active stop')
  await updateStopProgress(route, pickup, 'complete')
  await updateStopProgress(route, delivery, 'start')
  expect(progress()).toMatchObject([
    { stopId: pickup.stopId, startedAt, completedAt },
    { stopId: delivery.stopId, startedAt: completedAt },
  ])
  const signedEbol = storage.get(ORDER_EBOLS_STORAGE_KEY)
  await expect(updateStopProgress(route, pickup, 'fail', 'Customer unavailable')).rejects.toThrow('already confirmed')
  await updateStopProgress(route, pickup, 'undo')
  expect(storage.get(ORDER_EBOLS_STORAGE_KEY)).toBe(signedEbol)
  expect(progress()[0]?.completedAt).toBe(completedAt)
})

it('completes a Delivery signed through an older manual link during its unique active visit', async () => {
  const storage = mockStorage()
  const route = mockTodaySpokeRoute
  const delivery = route.tasks[6]
  vi.setSystemTime(new Date('2026-11-10T12:00:00.000Z'))
  await updateStopProgress(route, delivery, 'start')
  const signed = JSON.stringify([{
    orderNumber: delivery.externalId, status: 'completed', pickup: {},
    delivery: { lockedAt: '2026-11-10T12:05:00.000Z', contact: { signerName: 'Delivery contact' } },
  }])
  storage.set(ORDER_EBOLS_STORAGE_KEY, signed)
  vi.setSystemTime(new Date('2026-11-10T12:10:00.000Z'))
  await updateStopProgress(route, delivery, 'complete')
  const progress = parseStopProgress(storage.get(stopProgressKey(route))!)
  expect(progressForStop(progress, delivery)?.completedAt).toBe('2026-11-10T12:10:00.000Z')
  expect(storage.get(ORDER_EBOLS_STORAGE_KEY)).toBe(signed)
  expect(readEvidenceQueue()).toMatchObject([{ label: `Delivery stop #${delivery.externalId}`, detail: 'Stop completed' }])
})

it('rejects older, invalid, ambiguous and explicitly mismatched Delivery confirmations', async () => {
  const storage = mockStorage()
  const route = mockTodaySpokeRoute
  const delivery = route.tasks[6]
  const startedAt = '2026-11-10T12:00:00.000Z'
  vi.setSystemTime(new Date(startedAt))
  await updateStopProgress(route, delivery, 'start')
  const setDelivery = (handoff: object) => storage.set(ORDER_EBOLS_STORAGE_KEY, JSON.stringify([{
    orderNumber: delivery.externalId, status: 'completed', pickup: {}, delivery: handoff,
  }]))
  for (const handoff of [
    { lockedAt: '2026-11-10T11:00:00.000Z' },
    { lockedAt: 'invalid' },
    { lockedAt: '2026-11-10T12:05:00.000Z', stopVisit: { stopId: 'another-stop', startedAt } },
    { lockedAt: '2026-11-10T12:05:00.000Z', stopVisit: { stopId: delivery.stopId, startedAt: '2026-11-10T11:00:00.000Z' } },
    { lockedAt: '2026-11-10T12:05:00.000Z', verification: { stopId: 'another-stop', checkedAt: startedAt } },
  ]) {
    setDelivery(handoff)
    await expect(updateStopProgress(route, delivery, 'complete')).rejects.toThrow('Confirm the handoff')
  }
  setDelivery({ lockedAt: '2026-11-10T12:05:00.000Z' })
  storage.set(SPOKE_ROUTE_STORAGE_KEY, JSON.stringify({ ...route,
    tasks: [...route.tasks, { ...delivery, stopId: 'second-delivery-visit' }],
  }))
  await expect(updateStopProgress(route, delivery, 'complete')).rejects.toThrow('Confirm the handoff')
  expect(progressForStop(parseStopProgress(storage.get(stopProgressKey(route))!), delivery)?.completedAt).toBeUndefined()
})

it('fails an unstarted or active stop and restores it to ready without changing another active stop', async () => {
  const storage = mockStorage()
  const route = mockTodaySpokeRoute
  const [pickup, delivery] = route.tasks
  const failedAt = '2026-11-06T12:15:00.000Z'
  vi.setSystemTime(new Date(failedAt))
  const progress = () => parseStopProgress(storage.get(stopProgressKey(route)) ?? '')

  await expect(updateStopProgress(route, delivery, 'fail', '   ')).rejects.toThrow('Enter a reason')
  await updateStopProgress(route, delivery, 'fail', '  Customer unavailable  ')
  await updateStopProgress(route, delivery, 'fail', 'Duplicate attempt')
  expect(progressForStop(progress(), delivery)).toEqual({
    stopId: delivery.stopId, order: delivery.externalId, operation: delivery.operation,
    failure: { at: failedAt, reason: 'Customer unavailable' },
  })
  await expect(updateStopProgress(route, delivery, 'start')).rejects.toThrow('Undo the failed status')
  await expect(updateStopProgress(route, delivery, 'complete')).rejects.toThrow('Confirm the handoff')
  await updateStopProgress(route, pickup, 'start')
  await updateStopProgress(route, delivery, 'undo')
  expect(progressForStop(progress(), delivery)).toBeUndefined()
  expect(readEvidenceQueue()).toMatchObject([{ detail: 'Failure undone · Ready', status: 'pending', revision: 2 }])
  await expect(updateStopProgress(route, delivery, 'start')).rejects.toThrow('Complete the active stop')
  await updateStopProgress(route, pickup, 'fail', 'Customer refused')
  expect(progress().find(isActiveStop)).toBeUndefined()
  await updateStopProgress(route, delivery, 'start')
  await updateStopProgress(route, pickup, 'undo')
  expect(progressForStop(progress(), pickup)).toBeUndefined()
  expect(progress().find(isActiveStop)?.stopId).toBe(delivery.stopId)
  expect(storage.has(ORDER_EBOLS_STORAGE_KEY)).toBe(false)
})

it('requires terminal stops and records warehouse return independently of the last stop and repeat actions', async () => {
  const storage = mockStorage()
  const route = { ...mockTodaySpokeRoute, runId: '2026-11-06T08:00:00Z', tasks: mockTodaySpokeRoute.tasks.slice(0, 2) }
  storage.set(SPOKE_ROUTE_STORAGE_KEY, JSON.stringify(route))
  const [pickup, delivery] = route.tasks
  const at = (hour: number) => new Date(`2026-11-06T${hour}:00:00.000Z`)
  vi.setSystemTime(at(19))
  storage.set(stopProgressKey(route), JSON.stringify([{
    stopId: pickup.stopId, order: pickup.externalId, operation: pickup.operation,
    startedAt: at(18).toISOString(), completedAt: at(19).toISOString(),
  }]))
  await expect(completeSpokeRoute(route)).rejects.toThrow('Resolve all stops')
  await updateStopProgress(route, delivery, 'start')
  await expect(completeSpokeRoute(route)).rejects.toThrow('Resolve all stops')
  await updateStopProgress(route, delivery, 'fail', 'Customer unavailable')
  const progress = parseStopProgress(storage.get(stopProgressKey(route))!)
  expect(summarizeRouteStops(route, progress)).toMatchObject({ completed: 1, remaining: [], failed: [{ reason: 'Customer unavailable' }] })
  expect(readRouteCompletion(route)).toBeUndefined()
  vi.setSystemTime(at(21))
  await completeSpokeRoute(route)
  vi.setSystemTime(at(22))
  await completeSpokeRoute(route)
  expect(readRouteCompletion(route)).toEqual({ lastStopAt: at(19).toISOString(), completedAt: at(21).toISOString() })
  expect(readEvidenceQueue().filter((item) => item.label === 'Warehouse return')).toMatchObject([{ recordedAt: at(21).toISOString(), status: 'pending' }])
  await expect(updateStopProgress(route, delivery, 'undo')).rejects.toThrow('already been completed')
  expect(readRouteCompletion({ ...route, runId: 'another-cycle' })).toBeUndefined()
})

it('rolls back a failed stop save when the sync queue cannot be persisted', async () => {
  const storage = mockStorage()
  const setItem = localStorage.setItem
  localStorage.setItem = (key, value) => {
    if (key === EVIDENCE_QUEUE_KEY) throw new Error('quota')
    setItem(key, value)
  }
  const route = mockTodaySpokeRoute
  await expect(updateStopProgress(route, route.tasks[0], 'fail', 'Customer unavailable')).rejects.toThrow('Could not save the sync queue')
  expect(storage.has(stopProgressKey(route))).toBe(false)
  expect(readEvidenceQueue()).toEqual([])
})

it('retains evidence that route work started after undo removes the last failed entry', async () => {
  const storage = mockStorage()
  const route = mockTodaySpokeRoute
  await updateStopProgress(route, route.tasks[0], 'fail', 'Customer unavailable')
  await updateStopProgress(route, route.tasks[0], 'undo')
  const snapshot = storage.get(stopProgressKey(route))!
  expect(parseStopProgress(snapshot)).toEqual([])
  expect(routeHasWork(snapshot)).toBe(true)
  storage.delete(SPOKE_ROUTE_STORAGE_KEY)
  await expect(updateStopProgress(route, route.tasks[0], 'start')).rejects.toThrow('current route')
})
