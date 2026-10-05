import type { SpokeOperation, SpokeTask } from './spokeDomain'

export const teamRoles = ['Dispatcher', 'Broker', 'Manager'] as const
export interface TeamContact { name: string; nickname: string }
export type OrderTeam = Partial<Record<typeof teamRoles[number], TeamContact>>
const eastTeam: OrderTeam = {
  Dispatcher: { name: 'Casey Turner', nickname: 'casey_zaberman' },
  Broker: { name: 'Alex Reed', nickname: 'alex_zaberman' },
  Manager: { name: 'Jordan Blake', nickname: 'jordan_zaberman' },
}
const westTeam: OrderTeam = {
  Dispatcher: { name: 'Taylor Morgan', nickname: 'taylor_zaberman' },
  Manager: { name: 'Sam Parker', nickname: 'sam_zaberman' },
}
const orderTeams: Record<string, OrderTeam> = {
  '23343775': eastTeam, '23343778': westTeam, '23343780': eastTeam,
  '23343782': westTeam, '11155599': eastTeam, '11098765': westTeam, '11076543': eastTeam,
}
export function getOrderTeam(order: string): OrderTeam { return orderTeams[order] ?? {} }
export function telegramContactUrl(nickname: string) {
  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(nickname) ? `https://t.me/${nickname}` : undefined
}
export function orderContextTasks(tasks: SpokeTask[], order: string, operation?: SpokeOperation, stopId?: string) {
  return tasks.filter((task) => task.externalId === order && (!operation || task.operation === operation)
    && (!stopId || task.stopId === stopId))
}
export function teamContactsPath(order: string, operation?: SpokeOperation, stopId?: string) {
  const params = new URLSearchParams()
  if (operation) params.set('operation', operation)
  if (stopId) params.set('stop', stopId)
  return `/orders/${encodeURIComponent(order)}/details${params.size ? `?${params}` : ''}`
}
export interface TeamOrderContext {
  order: string; name: string; quantity: number | null; task?: SpokeTask; workDate: string
  handling: string; comment: string
}
export function orderSummaryText(context: TeamOrderContext) {
  const { order, name, quantity, task, workDate, handling, comment } = context
  return [
    `Order #${order}`, `Name: ${name}`, `Quantity: ${quantity ?? 'Not recorded'}${quantity === null ? '' : ' pcs'}`,
    task ? `${task.operation === 'pickup' ? 'Pickup' : 'Dropoff'} · Stop ${task.sequence}` : 'Stop: Not selected / not available',
    `Address: ${task?.address.trim() || 'Not available'}`,
    ...(task ? [`Scheduled: ${workDate} · ${task.scheduledTime}`] : []),
    ...(handling.trim() ? [`Handling: ${handling.trim()}`] : []),
    ...(comment.trim() ? [`Order note: ${comment.trim()}`] : []),
  ].join('\n')
}
