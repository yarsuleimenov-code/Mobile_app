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
    { stopId: 'spoke-01', sequence: 1, externalId: '23343775', operation: 'pickup', scheduledTime: '8:27 AM', title: 'Dining Chair', address: 'Belmont, MA 02478' },
    { stopId: 'spoke-02', sequence: 2, externalId: '11155599', operation: 'dropoff', scheduledTime: '9:42 AM', title: 'Wooden credenza', address: 'Woburn, MA 01801' },
    { stopId: 'spoke-03', sequence: 3, externalId: '23343778', operation: 'pickup', scheduledTime: '12:09 PM', title: 'Sofa / Side Table', address: 'Holden, MA 01520' },
    { stopId: 'spoke-04', sequence: 4, externalId: '11098765', operation: 'dropoff', scheduledTime: '2:32 PM', title: 'Crate-Mitchell', address: 'West Hartford, CT 06110' },
    { stopId: 'spoke-05', sequence: 5, externalId: '23343780', operation: 'pickup', scheduledTime: '5:00 PM', title: '4× Chair + Ottoman', address: 'Bedford Hills, NY 10507' },
    { stopId: 'spoke-06', sequence: 6, externalId: '23343782', operation: 'pickup', scheduledTime: '6:27 PM', title: 'Console Table', address: 'Greenwich, CT 06830' },
    { stopId: 'spoke-07', sequence: 7, externalId: '11076543', operation: 'dropoff', scheduledTime: '7:34 PM', title: 'Teak desk', address: 'Cos Cob, CT 06807' },
  ],
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
  const params = new URLSearchParams({ order: task.externalId, date: workDate })
  return `${path}?${params.toString()}`
}
