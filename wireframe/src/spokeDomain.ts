export type SpokeOperation = 'pickup' | 'dropoff'

export interface SpokeTask {
  stopId: string
  sequence: number
  externalId: string
  operation: SpokeOperation
  scheduledTime: string
  title: string
  address: string
}

export interface SpokeRoute {
  routeId: string
  name: string
  vehicle: string
  workDate: string
  syncedAt: string
  tasks: SpokeTask[]
}

export const mockTodaySpokeRoute: SpokeRoute = {
  routeId: 'extvan-boston-day-2-8am-20260821',
  name: 'ExtVan · Boston day 2 · 8 AM',
  vehicle: 'Extended Van',
  workDate: '08/21/2026',
  syncedAt: '2026-08-21T08:02:00-04:00',
  tasks: [
    { stopId: 'spoke-01', sequence: 1, externalId: '23343775', operation: 'pickup', scheduledTime: '8:27 AM', title: 'Dining Chair', address: '455 Concord Avenue, Belmont, MA 02478, USA' },
    { stopId: 'spoke-02', sequence: 2, externalId: '11155599', operation: 'dropoff', scheduledTime: '9:42 AM', title: 'Wooden credenza', address: '10 Common Street, Woburn, MA 01801, USA' },
    { stopId: 'spoke-03', sequence: 3, externalId: '23343778', operation: 'pickup', scheduledTime: '12:09 PM', title: 'Sofa / Side Table', address: '1204 Main Street, Holden, MA 01520, USA' },
    { stopId: 'spoke-04', sequence: 4, externalId: '11098765', operation: 'dropoff', scheduledTime: '2:32 PM', title: 'Crate-Mitchell', address: '50 South Main Street, West Hartford, CT 06107, USA' },
    { stopId: 'spoke-05', sequence: 5, externalId: '23343780', operation: 'pickup', scheduledTime: '5:00 PM', title: 'Chair + Ottoman', address: '321 Bedford Road, Bedford Hills, NY 10507, USA' },
    { stopId: 'spoke-06', sequence: 6, externalId: '23343782', operation: 'pickup', scheduledTime: '6:27 PM', title: 'Console Table', address: '101 Field Point Road, Greenwich, CT 06830, USA' },
    { stopId: 'spoke-07', sequence: 7, externalId: '11076543', operation: 'dropoff', scheduledTime: '7:34 PM', title: 'Teak desk', address: '5 Sinawoy Road, Cos Cob, CT 06807, USA' },
  ],
}

const legacyDemoAddresses: Record<string, string> = {
  'spoke-01': 'Belmont, MA 02478', 'spoke-02': 'Woburn, MA 01801', 'spoke-03': 'Holden, MA 01520',
  'spoke-04': 'West Hartford, CT 06110', 'spoke-05': 'Bedford Hills, NY 10507',
  'spoke-06': 'Greenwich, CT 06830', 'spoke-07': 'Cos Cob, CT 06807',
}
// Upgrade only unchanged addresses from the known local route fixture.
export function refreshDemoRouteAddresses(route: SpokeRoute): SpokeRoute {
  if (route.routeId !== mockTodaySpokeRoute.routeId) return route
  return { ...route, tasks: route.tasks.map((task) => {
    const sample = mockTodaySpokeRoute.tasks.find((item) => item.stopId === task.stopId
      && item.externalId === task.externalId && item.operation === task.operation)
    return sample && task.address === legacyDemoAddresses[task.stopId] ? { ...task, address: sample.address } : task
  }) }
}

export function filterSpokeTasks(tasks: SpokeTask[], query: string) {
  const normalized = query.trim().replace(/^#/, '').toLowerCase()
  if (!normalized) return tasks
  return tasks.filter((task) => (
    task.externalId.toLowerCase().includes(normalized)
    || task.title.toLowerCase().includes(normalized)
  ))
}

export function spokeTaskPath(task: SpokeTask, workDate: string) {
  const path = task.operation === 'pickup' ? '/pickup' : '/dropoff'
  const params = new URLSearchParams({ order: task.externalId, date: workDate, stop: task.stopId })
  return `${path}?${params.toString()}`
}
