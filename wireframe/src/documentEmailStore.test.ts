import { describe, expect, it } from 'vitest'
import {
  findDocumentEmailDelivery, readDocumentEmailDeliveries, resolveDocumentEmailDelivery,
  upsertDocumentEmailDelivery, writeDocumentEmailDeliveries,
} from './documentEmailStore'

const documentNumber = '23343775-PU-1'
const email = 'contact@example.com'
const requestedAt = '2026-08-25T10:05:00.000Z'
const updatedAt = '2026-08-25T10:06:00.000Z'

describe('Pickup document email delivery', () => {
  it('queues offline, records failure, and retries without changing the request', () => {
    const queued = resolveDocumentEmailDelivery(documentNumber, email, requestedAt, 'offline', 'success', undefined, updatedAt)
    expect(queued.status).toBe('queued')
    const failed = resolveDocumentEmailDelivery(documentNumber, email, requestedAt, 'online', 'error', queued, updatedAt)
    expect(failed.status).toBe('failed')
    const sent = resolveDocumentEmailDelivery(documentNumber, email, requestedAt, 'online', 'success', failed, updatedAt)
    expect(sent).toMatchObject({ status: 'sent', documentNumber, recipientEmail: email, requestedAt })
    expect(resolveDocumentEmailDelivery(documentNumber, email, requestedAt, 'online', 'success', sent, updatedAt)).toBe(sent)
  })

  it('persists status per document version and does not duplicate retries', () => {
    let value = ''
    const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next } }
    const first = resolveDocumentEmailDelivery(documentNumber, email, requestedAt, 'online', 'success', undefined, updatedAt)
    const second = resolveDocumentEmailDelivery('23343775-PU-2', 'other@example.com', requestedAt, 'offline', 'success', undefined, updatedAt)
    expect(writeDocumentEmailDeliveries(upsertDocumentEmailDelivery([first], second), storage)).toBe(true)
    const saved = readDocumentEmailDeliveries(storage)
    expect(saved).toHaveLength(2)
    expect(findDocumentEmailDelivery(saved, documentNumber, email)?.status).toBe('sent')
    expect(findDocumentEmailDelivery(saved, second.documentNumber, second.recipientEmail)?.status).toBe('queued')
    expect(upsertDocumentEmailDelivery(saved, first)).toHaveLength(2)
  })
})
