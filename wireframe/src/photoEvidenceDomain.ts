export const photoCategories = {
  before: 'Before pickup', after: 'After delivery', packaging: 'Packaging', condition: 'Condition', damage: 'Damage',
} as const
export type PhotoCategory = keyof typeof photoCategories
export type PhotoHandoff = 'pickup' | 'delivery'
export interface EvidencePhoto {
  id: string
  orderNumber: string
  handoff: PhotoHandoff
  category: PhotoCategory
  asset: number
  source: 'camera' | 'gallery' | 'fixture'
}

export function demoPhotos(orderNumber: string, handoff: PhotoHandoff, count: number, scope = 'base'): EvidencePhoto[] {
  const categories: PhotoCategory[] = [handoff === 'pickup' ? 'before' : 'after', 'packaging', 'condition', 'damage']
  return Array.from({ length: Math.max(0, Math.min(100, count)) }, (_, index) => ({
    id: `${orderNumber}-${handoff}-${scope}-${index + 1}`, orderNumber, handoff,
    category: categories[index % categories.length], asset: index % 4, source: 'fixture',
  }))
}

// Count-only fixtures/drafts remain readable; a real empty array must stay empty.
export function evidencePhotos(source: { photos?: EvidencePhoto[]; photoCount: number }, orderNumber: string, handoff: PhotoHandoff, scope = 'base') {
  return (source.photos ?? demoPhotos(orderNumber, handoff, source.photoCount, scope))
    .map((photo) => ({ ...photo, orderNumber, handoff }))
}

export function addEvidencePhoto(photos: EvidencePhoto[], photo: EvidencePhoto) {
  return photos.some((item) => item.id === photo.id) ? photos : [...photos, photo]
}

export function removeEvidencePhoto(photos: EvidencePhoto[], id: string) {
  return photos.filter((photo) => photo.id !== id)
}

export type EvidenceSyncStatus = 'pending' | 'syncing' | 'synced' | 'retry' | 'conflict' | 'rejected'
export interface EvidenceSyncItem {
  id: string
  operationId: string
  kind: 'operation' | 'photo'
  label: string
  detail: string
  fingerprint: string
  revision: number
  status: EvidenceSyncStatus
  resolution?: 'keep-local'
}
export interface EvidenceOperation {
  id: string
  orderNumber: string
  handoff: PhotoHandoff
  photos: EvidencePhoto[]
  detail: string
  fingerprint: string
}

export function trackEvidence(queue: EvidenceSyncItem[], operation: EvidenceOperation): EvidenceSyncItem[] {
  const entries = [
    { id: operation.id, kind: 'operation' as const, label: `${operation.handoff === 'pickup' ? 'Pickup' : 'Delivery'} #${operation.orderNumber}`, detail: operation.detail, fingerprint: operation.fingerprint },
    ...operation.photos.map((photo, index) => ({ id: `${operation.id}/${photo.id}`, kind: 'photo' as const,
      label: `Photo ${index + 1} · ${photoCategories[photo.category]}`, detail: photo.id, fingerprint: JSON.stringify(photo) })),
  ]
  const previous = new Map(queue.map((item) => [item.id, item]))
  const tracked = entries.map((entry): EvidenceSyncItem => {
    const existing = previous.get(entry.id)
    return existing?.fingerprint === entry.fingerprint && existing.label === entry.label ? existing
      : { ...entry, operationId: operation.id, revision: (existing?.revision ?? 0) + 1, status: 'pending' }
  })
  const unchanged = queue.filter((item) => item.operationId !== operation.id)
  const next = [...unchanged, ...tracked]
  return next.length === queue.length && next.every((item) => previous.get(item.id) === item) ? queue : next
}

export function beginEvidenceSync(queue: EvidenceSyncItem[], operationId?: string) {
  const blocked = new Set(queue.filter((item) => item.status === 'conflict').map((item) => item.operationId))
  return queue.filter((item) => (!operationId || item.operationId === operationId)
    && !blocked.has(item.operationId) && item.status !== 'synced' && item.status !== 'syncing')
}

export function finishEvidenceSync(queue: EvidenceSyncItem[], batch: EvidenceSyncItem[], outcome: 'success' | 'retry' | 'conflict' | 'rejected' | 'offline') {
  const revisions = new Map(batch.map((item) => [item.id, item.revision]))
  const resolved = new Set(batch.filter((item) => item.resolution === 'keep-local').map((item) => item.operationId))
  return queue.map((item): EvidenceSyncItem => {
    // A late result cannot acknowledge a newer edit, a removed photo, or another operation.
    if (revisions.get(item.id) !== item.revision) return item
    const status = outcome === 'offline' ? 'pending' : outcome === 'success' ? 'synced'
      : outcome === 'conflict' ? (resolved.has(item.operationId) ? 'synced' : item.kind === 'operation' ? 'conflict' : 'pending') : outcome
    return { ...item, status }
  })
}

export function resolveEvidenceConflict(queue: EvidenceSyncItem[], operationId: string) {
  return queue.map((item): EvidenceSyncItem => item.operationId === operationId && item.status === 'conflict'
    ? { ...item, status: 'pending', resolution: 'keep-local', revision: item.revision + 1 } : item)
}

export const EVIDENCE_QUEUE_KEY = 'zaberman-evidence-queue:v1'
export interface EvidenceStorage { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void }
export function readEvidenceQueue(storage: EvidenceStorage = localStorage): EvidenceSyncItem[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(EVIDENCE_QUEUE_KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter((item): item is EvidenceSyncItem => item && typeof item.id === 'string'
      && typeof item.operationId === 'string' && typeof item.fingerprint === 'string'
      && typeof item.label === 'string' && typeof item.detail === 'string'
      && Number.isInteger(item.revision) && (item.kind === 'operation' || item.kind === 'photo')
      && ['pending', 'syncing', 'synced', 'retry', 'conflict', 'rejected'].includes(item.status))
      .map((item) => item.status === 'syncing' ? { ...item, status: 'pending' } : item)
  } catch { return [] }
}
export function writeEvidenceQueue(queue: EvidenceSyncItem[], storage: EvidenceStorage = localStorage) {
  try { storage.setItem(EVIDENCE_QUEUE_KEY, JSON.stringify(queue)); return true } catch { return false }
}
