import { afterEach, expect, it, vi } from 'vitest'
import { ORDER_EBOLS_STORAGE_KEY } from './orderEbolStore'
import { mockTodaySpokeRoute } from './spokeDomain'
import { parseStopProgress, stopProgressKey, updateStopProgress } from './routeStopProgress'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('releases the active stop only after its own new handoff and explicit completion', async () => {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  })
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('window', { dispatchEvent: vi.fn() })
  vi.useFakeTimers()

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
  await expect(updateStopProgress(route, delivery, 'start')).rejects.toThrow('Complete the active stop')
  await updateStopProgress(route, pickup, 'complete')
  await updateStopProgress(route, delivery, 'start')
  expect(progress()).toMatchObject([
    { stopId: pickup.stopId, startedAt, completedAt },
    { stopId: delivery.stopId, startedAt: completedAt },
  ])
})
