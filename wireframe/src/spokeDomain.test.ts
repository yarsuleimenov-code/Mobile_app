import { describe, expect, it } from 'vitest'
import { filterSpokeTasks, mockTodaySpokeRoute, spokeTaskPath } from './spokeDomain'

describe('Spoke route import', () => {
  it('finds a stop by External ID', () => {
    expect(filterSpokeTasks(mockTodaySpokeRoute.tasks, '#23343780').map((task) => task.stopId)).toEqual(['spoke-05'])
  })

  it('opens the existing operation with the Spoke order number', () => {
    expect(spokeTaskPath(mockTodaySpokeRoute.tasks[0], mockTodaySpokeRoute.workDate)).toBe('/pickup?order=23343775&date=08%2F21%2F2026')
    expect(spokeTaskPath(mockTodaySpokeRoute.tasks[1], mockTodaySpokeRoute.workDate)).toBe('/dropoff?order=11155599&date=08%2F21%2F2026')
  })
})
