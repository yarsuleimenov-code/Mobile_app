import { afterEach, expect, it, vi } from 'vitest'
import { canCompleteRouteLoading, expectedLoadPlaces, routeLoadingIssue, updateRouteLoading, warehouseLoadOrders } from './routeLoadingDomain'
import { nextRouteLoadingPlan, warehouseWorkDate } from './routeLoadingFixture'
import { readRouteLoadingSession, saveRouteLoadingAction } from './routeLoadingStore'

const at = '2026-11-06T21:00:00.000Z'
const plan = nextRouteLoadingPlan('2026-11-07')
const places = expectedLoadPlaces(plan)

afterEach(() => vi.unstubAllGlobals())

it('uses the warehouse calendar and keeps only warehouse Delivery stops in the loading manifest', () => {
  expect(warehouseWorkDate(1, new Date('2026-11-07T02:00:00Z'))).toBe('2026-11-07')
  expect(plan.stops).toHaveLength(9)
  expect(warehouseLoadOrders(plan)).toHaveLength(4)
  expect(places).toHaveLength(5)
  const routePickupDelivery = structuredClone(plan)
  routePickupDelivery.stops[3].loadSource = 'route_pickup'
  expect(expectedLoadPlaces(routePickupDelivery)).toHaveLength(3)
})

it('blocks start when a warehouse Delivery has no complete or unique place list', () => {
  const missing = structuredClone(plan)
  delete missing.stops[3].placeIds
  expect(routeLoadingIssue(missing)).toContain('#76000004')
  expect(() => updateRouteLoading(missing, undefined, { type: 'start' }, at)).toThrow('place list is missing')
  const duplicate = structuredClone(plan)
  duplicate.stops[5].placeIds = [places[0].placeId.toLowerCase()]
  expect(() => updateRouteLoading(duplicate, undefined, { type: 'start' }, at)).toThrow('duplicate label')
})

it('persists the frozen load by route and date and completes only after all five distinct places are scanned', async () => {
  const storage = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  })
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('window', { dispatchEvent: vi.fn() })
  await saveRouteLoadingAction(plan, { type: 'start' })
  const cargoUrl = `https://script.google.com/a/macros/zaberman.com/s/test/exec?cargo=${places[0].placeId.toLowerCase()}`
  await saveRouteLoadingAction(plan, { type: 'scan', code: cargoUrl })
  await expect(saveRouteLoadingAction(plan, { type: 'scan', code: places[0].placeId })).rejects.toThrow('already loaded')
  await expect(saveRouteLoadingAction(plan, { type: 'scan', code: 'ZB-11155599-01', knownPlace: true })).rejects.toThrow('another load')
  await expect(saveRouteLoadingAction(plan, { type: 'scan', code: '76000004' })).rejects.toThrow('Label not found')
  for (const { placeId } of places.slice(1, 4)) await saveRouteLoadingAction(plan, { type: 'scan', code: placeId })
  const restored = readRouteLoadingSession(plan)!
  expect(restored.loadedPlaceIds).toHaveLength(4)
  expect(canCompleteRouteLoading(restored)).toBe(false)
  expect(readRouteLoadingSession(nextRouteLoadingPlan('2026-11-08'))).toBeUndefined()
  const changedSource = { ...plan, stops: [] }
  await expect(saveRouteLoadingAction(changedSource, { type: 'complete' })).rejects.toThrow('remaining place')
  await saveRouteLoadingAction(plan, { type: 'scan', code: places[4].placeId })
  await saveRouteLoadingAction(plan, { type: 'remove', placeId: places[0].placeId })
  await expect(saveRouteLoadingAction(plan, { type: 'complete' })).rejects.toThrow('remaining place')
  await saveRouteLoadingAction(plan, { type: 'scan', code: places[0].placeId })
  const closed = await saveRouteLoadingAction(changedSource, { type: 'complete' })
  expect(closed.completedAt).toBeTruthy()
  expect(readRouteLoadingSession(plan)).toEqual(closed)
  expect(closed.plan.stops).toHaveLength(9)
  await expect(saveRouteLoadingAction(plan, { type: 'remove', placeId: places[0].placeId })).rejects.toThrow('already complete')
})
