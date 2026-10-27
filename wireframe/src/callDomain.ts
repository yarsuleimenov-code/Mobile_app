import type { CommunicationThread } from './communicationDomain'

export interface CustomerCall {
  id: string
  customerName: string
  customerPhone: string
  direction: 'inbound' | 'outbound'
  outcome: 'missed' | 'completed' | 'cancelled'
  startedAt: string
  duration: number
  seen: boolean
  orderNumber?: string
  operation?: CommunicationThread['operation']
  routeDate?: string
}

export const initialCustomerCalls: CustomerCall[] = [
  { id: 'call-1', customerName: 'Laura Bennett', customerPhone: '+1 617 555 0142', direction: 'inbound', outcome: 'missed', startedAt: '2026-09-21T09:25:00-04:00', duration: 0, seen: false },
  { id: 'call-2', customerName: 'Michael Reed', customerPhone: '+1 781 555 0198', direction: 'outbound', outcome: 'completed', startedAt: '2026-09-21T09:10:00-04:00', duration: 83, seen: true, orderNumber: '11155599', operation: 'dropoff', routeDate: '08/21/2026' },
  { id: 'call-3', customerName: 'James Wilson', customerPhone: '+1 203 555 0137', direction: 'inbound', outcome: 'missed', startedAt: '2026-09-20T16:40:00-04:00', duration: 0, seen: false, orderNumber: '23343782', operation: 'pickup', routeDate: '08/21/2026' },
  { id: 'call-4', customerName: 'Sarah Coleman', customerPhone: '+1 508 555 0126', direction: 'inbound', outcome: 'completed', startedAt: '2026-09-20T10:30:00-04:00', duration: 42, seen: true, orderNumber: '23343778', operation: 'pickup', routeDate: '08/21/2026' },
]

// An incoming number identifies a contact, not the subject of their call.
export function callOrderCandidates(call: CustomerCall, threads: CommunicationThread[], routeOrders: string[]) {
  if (call.orderNumber) return threads.filter((thread) => thread.orderNumber === call.orderNumber)
  const phone = call.customerPhone.replace(/\D/g, '')
  const matches = threads.filter((thread) => thread.customerPhone.replace(/\D/g, '') === phone)
  const current = matches.filter((thread) => routeOrders.includes(thread.orderNumber))
  return current.length ? current : matches
}

export function markCallsSeen(calls: CustomerCall[]) {
  return calls.map((call) => call.outcome === 'missed' && !call.seen ? { ...call, seen: true } : call)
}

export function filterCalls(calls: CustomerCall[], query: string, missedOnly: boolean, threads: CommunicationThread[] = [], routeOrders: string[] = []) {
  const normalized = query.trim().toLowerCase()
  return calls.filter((call) => (!missedOnly || call.outcome === 'missed')
    && [call.customerName, call.customerPhone, call.orderNumber ?? '', ...callOrderCandidates(call, threads, routeOrders).map((thread) => thread.orderNumber)].some((value) => value.toLowerCase().includes(normalized)))
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
}
