export const CORPORATE_SMS_NUMBER = '17178361039'
export const CORPORATE_SMS_NUMBER_LABEL = '+1 717 836 1039'

export type SmsDirection = 'inbound' | 'outbound'
export type SmsStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'received'

export interface SmsMessage {
  id: string
  direction: SmsDirection
  body: string
  createdAt: string
  status: SmsStatus
}

export interface CommunicationThread {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  operation: 'pickup' | 'dropoff'
  unreadCount: number
  messages: SmsMessage[]
}

const seed = (
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  operation: CommunicationThread['operation'],
  messages: Array<[SmsDirection, string, string]>,
  unreadCount = 0,
): CommunicationThread => ({
  id: `sms-${orderNumber}`,
  orderNumber,
  customerName,
  customerPhone,
  operation,
  unreadCount,
  messages: messages.map(([direction, body, createdAt], index) => ({
    id: `sms-${orderNumber}-${index + 1}`,
    direction,
    body,
    createdAt,
    status: direction === 'inbound' ? 'received' : 'sent',
  })),
})

export const initialCommunicationThreads: CommunicationThread[] = [
  seed('23343775', 'Laura Bennett', '+1 617 555 0142', 'pickup', [
    ['outbound', 'Hi Laura, this is Zaberman. We are about 25 minutes away for your pickup.', '2026-09-21T08:02:00-04:00'],
    ['inbound', 'Thank you. Please use the side entrance; I will meet you there.', '2026-09-21T08:05:00-04:00'],
  ], 1),
  seed('11155599', 'Michael Reed', '+1 781 555 0198', 'dropoff', [
    ['inbound', 'Could you call the intercom when you arrive?', '2026-09-21T09:07:00-04:00'],
    ['outbound', 'Yes, we will message you as soon as the truck is outside.', '2026-09-21T09:10:00-04:00'],
  ]),
  seed('23343778', 'Sarah Coleman', '+1 508 555 0126', 'pickup', [
    ['outbound', 'Hi Sarah, your pickup remains scheduled for 12:09 PM.', '2026-09-21T10:41:00-04:00'],
    ['inbound', 'Perfect. The sofa is ready on the first floor.', '2026-09-21T10:44:00-04:00'],
  ]),
  seed('11098765', 'Daniel Ortiz', '+1 860 555 0164', 'dropoff', [
    ['outbound', 'Zaberman delivery update: we expect to arrive between 2:20 and 2:40 PM.', '2026-09-21T12:58:00-04:00'],
    ['inbound', 'Received, thank you.', '2026-09-21T13:03:00-04:00'],
  ]),
  seed('23343780', 'Emily Foster', '+1 914 555 0181', 'pickup', [
    ['inbound', 'The building has a loading area behind the lobby.', '2026-09-21T15:12:00-04:00'],
    ['outbound', 'Thanks, we added that note to the pickup.', '2026-09-21T15:16:00-04:00'],
  ]),
  seed('23343782', 'James Wilson', '+1 203 555 0137', 'pickup', [
    ['outbound', 'Hi James, we are completing the previous stop and will update you shortly.', '2026-09-21T16:48:00-04:00'],
    ['inbound', 'No problem. Someone will be at the address until 7 PM.', '2026-09-21T16:51:00-04:00'],
  ], 1),
  seed('11076543', 'Olivia Parker', '+1 203 555 0175', 'dropoff', [
    ['outbound', 'Your Zaberman delivery is scheduled for this evening. Is the driveway accessible for the truck?', '2026-09-21T17:22:00-04:00'],
    ['inbound', 'Yes, the driveway is clear.', '2026-09-21T17:26:00-04:00'],
  ]),
]

export function latestMessage(thread: CommunicationThread) {
  return thread.messages.at(-1)
}

export function createOutboundMessage(
  thread: CommunicationThread,
  body: string,
  offline: boolean,
  id: string,
  createdAt: string,
): CommunicationThread {
  const normalized = body.trim()
  if (!normalized) throw new Error('Message cannot be empty')
  return {
    ...thread,
    messages: [...thread.messages, {
      id,
      direction: 'outbound',
      body: normalized,
      createdAt,
      status: offline ? 'queued' : 'sending',
    }],
  }
}

export function updateMessageStatus(thread: CommunicationThread, messageId: string, status: SmsStatus) {
  return {
    ...thread,
    messages: thread.messages.map((message) => message.id === messageId ? { ...message, status } : message),
  }
}

export function appendInboundMessage(thread: CommunicationThread, message: SmsMessage) {
  if (thread.messages.some((item) => item.id === message.id)) return thread
  return { ...thread, unreadCount: thread.unreadCount + 1, messages: [...thread.messages, message] }
}

export function markThreadRead(thread: CommunicationThread) {
  return thread.unreadCount ? { ...thread, unreadCount: 0 } : thread
}

export function communicationPath(orderNumber: string) {
  return `/orders/${orderNumber}/communications`
}
