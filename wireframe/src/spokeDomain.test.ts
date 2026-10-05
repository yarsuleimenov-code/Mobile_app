import { describe, expect, it } from 'vitest'
import { filterSpokeTasks, mockTodaySpokeRoute, refreshDemoRouteAddresses, spokeTaskPath } from './spokeDomain'

describe('Spoke route import', () => {
  it('upgrades only unchanged legacy fixture addresses and preserves other data', () => {
    const old = { ...mockTodaySpokeRoute, tasks: [{ ...mockTodaySpokeRoute.tasks[0], address: 'Belmont, MA 02478', scheduledTime: '10 AM' }, { ...mockTodaySpokeRoute.tasks[1], address: 'Custom address' }] }
    const updated = refreshDemoRouteAddresses(old)
    expect(updated.tasks[0].address).toBe('455 Concord Avenue, Belmont, MA 02478, USA')
    expect(updated.tasks[0].scheduledTime).toBe('10 AM')
    expect(updated.tasks[1].address).toBe('Custom address')
    expect(refreshDemoRouteAddresses({ ...old, routeId: 'other-route' }).tasks).toEqual(old.tasks)
    expect(refreshDemoRouteAddresses({ ...old, tasks: [{ ...old.tasks[0], externalId: 'other-order' }] }).tasks[0].address).toBe('Belmont, MA 02478')
    expect(refreshDemoRouteAddresses(updated)).toEqual(updated)
  })
  it('finds a stop by External ID', () => {
    expect(filterSpokeTasks(mockTodaySpokeRoute.tasks, '#23343780').map((task) => task.stopId)).toEqual(['spoke-05'])
  })

  it('opens the existing operation with the Spoke order number', () => {
    expect(spokeTaskPath(mockTodaySpokeRoute.tasks[0], mockTodaySpokeRoute.workDate)).toBe('/pickup?order=23343775&date=08%2F21%2F2026&stop=spoke-01')
    expect(spokeTaskPath(mockTodaySpokeRoute.tasks[1], mockTodaySpokeRoute.workDate)).toBe('/dropoff?order=11155599&date=08%2F21%2F2026&stop=spoke-02')
  })
})
