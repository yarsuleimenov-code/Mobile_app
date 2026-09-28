import { describe, expect, it } from 'vitest'
import {
  appendInboundMessage,
  callPath,
  CORPORATE_SMS_NUMBER,
  createOutboundMessage,
  communicationDayLabel,
  filterCommunicationThreads,
  formatCallDuration,
  initialCommunicationThreads,
  markThreadRead,
  updateMessageStatus,
} from './communicationDomain'

describe('Order SMS communications', () => {
  const original = initialCommunicationThreads[0]

  it('uses the approved corporate sender and keeps one thread per mock order', () => {
    expect(CORPORATE_SMS_NUMBER).toBe('17178361039')
    expect(new Set(initialCommunicationThreads.map((thread) => thread.orderNumber)).size).toBe(initialCommunicationThreads.length)
  })

  it('queues offline messages and sends online messages without changing other orders', () => {
    const queued = createOutboundMessage(original, '  On our way  ', true, 'out-1', '2026-09-25T10:00:00Z')
    const sending = createOutboundMessage(original, 'On our way', false, 'out-2', '2026-09-25T10:00:00Z')
    expect(queued.messages.at(-1)).toMatchObject({ body: 'On our way', status: 'queued' })
    expect(sending.messages.at(-1)?.status).toBe('sending')
    expect(updateMessageStatus(sending, 'out-2', 'failed').messages.at(-1)?.status).toBe('failed')
    expect(original.messages).toHaveLength(2)
  })

  it('deduplicates incoming provider messages and clears unread when opened', () => {
    const incoming = { id: 'provider-1', direction: 'inbound' as const, body: 'Ready', createdAt: '2026-09-25T10:01:00Z', status: 'received' as const }
    const once = appendInboundMessage(markThreadRead(original), incoming)
    const duplicate = appendInboundMessage(once, incoming)
    expect(once.unreadCount).toBe(1)
    expect(duplicate.messages).toHaveLength(once.messages.length)
    expect(markThreadRead(duplicate).unreadCount).toBe(0)
  })

  it('rejects an empty outgoing message', () => {
    expect(() => createOutboundMessage(original, '   ', false, 'out-3', '2026-09-25T10:00:00Z')).toThrow('empty')
  })

  it('filters the inbox by customer, order, message text and unread state', () => {
    expect(filterCommunicationThreads(initialCommunicationThreads, 'Laura').map((thread) => thread.orderNumber)).toEqual(['23343775'])
    expect(filterCommunicationThreads(initialCommunicationThreads, '11155599')).toHaveLength(1)
    expect(filterCommunicationThreads(initialCommunicationThreads, 'driveway')).toHaveLength(1)
    expect(filterCommunicationThreads(initialCommunicationThreads, '', true).every((thread) => thread.unreadCount > 0)).toBe(true)
  })

  it('uses readable day labels in a conversation', () => {
    const now = new Date('2026-09-25T12:00:00-04:00')
    expect(communicationDayLabel('2026-09-25T08:00:00-04:00', now)).toBe('Today')
    expect(communicationDayLabel('2026-09-24T08:00:00-04:00', now)).toBe('Yesterday')
    expect(communicationDayLabel('2026-09-21T08:00:00-04:00', now)).toMatch(/Sep 21/)
  })

  it('builds the order call route and formats call duration', () => {
    expect(callPath('23343775')).toBe('/orders/23343775/call')
    expect(formatCallDuration(0)).toBe('0:00')
    expect(formatCallDuration(65)).toBe('1:05')
  })
})
