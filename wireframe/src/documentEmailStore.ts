export const DOCUMENT_EMAIL_STORAGE_KEY = 'zaberman-document-email:v1'

export type DocumentEmailStatus = 'queued' | 'sent' | 'failed'

export interface DocumentEmailDelivery {
  documentNumber: string
  recipientEmail: string
  requestedAt: string
  updatedAt: string
  status: DocumentEmailStatus
}

interface EmailStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function isDelivery(value: unknown): value is DocumentEmailDelivery {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<DocumentEmailDelivery>
  return typeof item.documentNumber === 'string'
    && typeof item.recipientEmail === 'string'
    && typeof item.requestedAt === 'string'
    && typeof item.updatedAt === 'string'
    && (item.status === 'queued' || item.status === 'sent' || item.status === 'failed')
}

export function readDocumentEmailDeliveries(storage: EmailStorage = localStorage): DocumentEmailDelivery[] {
  try {
    const stored = storage.getItem(DOCUMENT_EMAIL_STORAGE_KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter(isDelivery) : []
  } catch {
    return []
  }
}

export function writeDocumentEmailDeliveries(deliveries: DocumentEmailDelivery[], storage: EmailStorage = localStorage) {
  try {
    storage.setItem(DOCUMENT_EMAIL_STORAGE_KEY, JSON.stringify(deliveries))
    return true
  } catch {
    return false
  }
}

export function upsertDocumentEmailDelivery(deliveries: DocumentEmailDelivery[], delivery: DocumentEmailDelivery) {
  return [delivery, ...deliveries.filter((item) => item.documentNumber !== delivery.documentNumber)]
}

export function findDocumentEmailDelivery(deliveries: DocumentEmailDelivery[], documentNumber: string, recipientEmail: string) {
  return deliveries.find((item) => item.documentNumber === documentNumber && item.recipientEmail === recipientEmail)
}

export function resolveDocumentEmailDelivery(
  documentNumber: string,
  recipientEmail: string,
  requestedAt: string,
  network: 'online' | 'offline' | 'slow',
  outcome: 'success' | 'error',
  previous?: DocumentEmailDelivery,
  updatedAt = new Date().toISOString(),
): DocumentEmailDelivery {
  if (previous?.status === 'sent') return previous
  return {
    documentNumber, recipientEmail, requestedAt, updatedAt,
    status: network === 'offline' ? 'queued' : outcome === 'error' ? 'failed' : 'sent',
  }
}
