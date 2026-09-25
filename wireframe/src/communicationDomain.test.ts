import { describe, expect, it } from 'vitest'
import {
  appendInboundMessage,
  CORPORATE_SMS_NUMBER,
  createOutboundMessage,
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
})
