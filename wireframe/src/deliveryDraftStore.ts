import { demoPhotos, type EvidencePhoto, type EvidenceStorage } from './photoEvidenceDomain'

export interface DeliveryDraft {
  photos: EvidencePhoto[]
  matches: boolean
  noDamage: boolean
  damageReported: boolean
  damageNote: string
}
const key = (orderNumber: string) => `zaberman-delivery-draft:v1:${orderNumber}`
export function readDeliveryDraft(orderNumber: string, storage: EvidenceStorage = localStorage): DeliveryDraft {
  const fallback: DeliveryDraft = { photos: demoPhotos(orderNumber, 'delivery', 2), matches: false, noDamage: false, damageReported: false, damageNote: '' }
  try {
    const value = JSON.parse(storage.getItem(key(orderNumber)) ?? 'null') as DeliveryDraft | null
    return value && Array.isArray(value.photos) && typeof value.damageNote === 'string' ? value : fallback
  } catch { return fallback }
}
export function writeDeliveryDraft(orderNumber: string, draft: DeliveryDraft, storage: EvidenceStorage = localStorage) {
  try { storage.setItem(key(orderNumber), JSON.stringify(draft)); return true } catch { return false }
}
