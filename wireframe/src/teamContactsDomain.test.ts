import { describe, expect, it } from 'vitest'
import { getOrderTeam, orderContextTasks, orderSummaryText, teamContactsPath, telegramContactUrl } from './teamContactsDomain'
import { mockTodaySpokeRoute, type SpokeTask } from './spokeDomain'

describe('order team contacts', () => {
  it('assigns different teams by order and leaves missing roles/orders unassigned', () => {
    expect(getOrderTeam('23343775').Dispatcher).not.toEqual(getOrderTeam('23343778').Dispatcher)
    expect(getOrderTeam('23343778').Broker).toBeUndefined()
    expect(getOrderTeam('999999')).toEqual({})
  })
  it('creates only valid Telegram links', () => {
    expect(telegramContactUrl('casey_zaberman')).toBe('https://t.me/casey_zaberman')
    for (const invalid of ['', '@someone', 'x/y', 'abc', 'https://evil.test']) expect(telegramContactUrl(invalid)).toBeUndefined()
  })
  it('keeps order, operation and stop together without falling back to another stop', () => {
    const pickup = mockTodaySpokeRoute.tasks[0]
    const dropoff: SpokeTask = { ...pickup, stopId: 'later', operation: 'dropoff', address: 'Other address', sequence: 8 }
    const tasks = [pickup, dropoff, mockTodaySpokeRoute.tasks[1]]
    expect(orderContextTasks(tasks, pickup.externalId)).toEqual([pickup, dropoff])
    expect(orderContextTasks(tasks, pickup.externalId, 'dropoff')).toEqual([dropoff])
    expect(orderContextTasks(tasks, pickup.externalId, 'dropoff', pickup.stopId)).toEqual([])
    expect(orderContextTasks(tasks, pickup.externalId, undefined, 'later')).toEqual([dropoff])
    expect(teamContactsPath(pickup.externalId, 'pickup', pickup.stopId)).toBe('/orders/23343775/details?operation=pickup&stop=spoke-01')
  })
  it('copies the visible order context, not customer/private contact details', () => {
    const text = orderSummaryText({ order: '23343775', name: 'Dining Chair', quantity: 3, task: mockTodaySpokeRoute.tasks[0], workDate: '08/21/2026', handling: 'Fragile', comment: 'Call on arrival' })
    expect(text).toContain('Order #23343775\nName: Dining Chair\nQuantity: 3 pcs\nPickup · Stop 1\nAddress: 455 Concord Avenue, Belmont, MA 02478, USA')
    expect(text).toContain('Scheduled: 08/21/2026 · 8:27 AM\nHandling: Fragile\nOrder note: Call on arrival')
    expect(text).not.toContain('Telegram')
  })
  it('reports missing context without fabricated quantity, address or time', () => {
    const text = orderSummaryText({ order: '999999', name: 'Order #999999', quantity: null, workDate: '08/21/2026', handling: '', comment: '' })
    expect(text).toContain('Quantity: Not recorded')
    expect(text).toContain('Address: Not available')
    expect(text).not.toContain('Scheduled:')
    expect(text).not.toContain('undefined')
  })
})
