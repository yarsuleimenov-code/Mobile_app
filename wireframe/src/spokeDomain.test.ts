import { describe, expect, it } from 'vitest'
import { filterSpokeTasks, mockTodaySpokeRoute, productLines, refreshDemoRoute, spokeTaskPath } from './spokeDomain'

describe('Spoke route import', () => {
  it('upgrades known legacy fixture addresses and missing item lists without replacing populated data', () => {
    const old = { ...mockTodaySpokeRoute, tasks: [
      { ...mockTodaySpokeRoute.tasks[0], address: 'Belmont, MA 02478', scheduledTime: '10 AM', products: undefined, notes: undefined },
      { ...mockTodaySpokeRoute.tasks[1], address: 'Custom address', products: '2×Custom chairs', notes: 'Custom note' },
    ] }
    const updated = refreshDemoRoute(old)
    expect(updated.tasks[0].address).toBe('455 Concord Avenue, Belmont, MA 02478, USA')
    expect(updated.tasks[0].scheduledTime).toBe('10 AM')
    expect(updated.tasks[1].address).toBe('Custom address')
    expect(updated.tasks[0].products).toBe('6×Dining Chairs')
    expect(updated.tasks[0].notes).toBeTruthy()
    expect(updated.tasks[1]).toEqual(old.tasks[1])
    expect(refreshDemoRoute({ ...old, routeId: 'other-route' }).tasks).toEqual(old.tasks)
    expect(refreshDemoRoute({ ...old, tasks: [{ ...old.tasks[0], externalId: 'other-order' }] }).tasks[0].address).toBe('Belmont, MA 02478')
    expect(refreshDemoRoute(updated)).toEqual(updated)
  })

  it('shows separate quantified items and preserves descriptions without a quantity', () => {
    expect(productLines('12×Chairs + 1×Dining Table')).toEqual(['12 × Chairs', '1 × Dining Table'])
    expect(productLines('2xbenches, 1xchair')).toEqual(['2 × benches', '1 × chair'])
    expect(productLines('1×Console Table-Terracotta Top')).toEqual(['1 × Console Table-Terracotta Top'])
    expect(productLines('Sofa + Side Table\n2x4 Board')).toEqual(['Sofa + Side Table', '2x4 Board'])
    expect(productLines(undefined)).toEqual([])
  })
  it('finds a stop by External ID', () => {
    expect(filterSpokeTasks(mockTodaySpokeRoute.tasks, '#23343780').map((task) => task.stopId)).toEqual(['spoke-05'])
  })

  it('opens the existing operation with the Spoke order number', () => {
    expect(spokeTaskPath(mockTodaySpokeRoute.tasks[0], mockTodaySpokeRoute.workDate)).toBe('/pickup?order=23343775&date=08%2F21%2F2026&stop=spoke-01')
    expect(spokeTaskPath(mockTodaySpokeRoute.tasks[1], mockTodaySpokeRoute.workDate)).toBe('/dropoff?order=11155599&date=08%2F21%2F2026&stop=spoke-02')
  })
})
