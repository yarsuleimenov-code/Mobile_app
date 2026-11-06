import type { EvidencePhoto, EvidenceStorage } from './photoEvidenceDomain'

export interface DeliveryDraft {
  photos: EvidencePhoto[]
  damageReported: boolean
  damageNote: string
}
const key = (orderNumber: string) => `zaberman-delivery-draft:v1:${orderNumber}`
export function readDeliveryDraft(orderNumber: string, storage: EvidenceStorage = localStorage): DeliveryDraft {
  const fallback: DeliveryDraft = { photos: [], damageReported: false, damageNote: '' }
  try {
    const value = JSON.parse(storage.getItem(key(orderNumber)) ?? 'null') as DeliveryDraft | null
    if (!value || !Array.isArray(value.photos) || typeof value.damageNote !== 'string') return fallback
    return {
      photos: value.photos,
      damageReported: Boolean(value.damageReported) || hasDamagePhoto(value.photos),
      damageNote: value.damageNote,
    }
  } catch { return fallback }
}
export function writeDeliveryDraft(orderNumber: string, draft: DeliveryDraft, storage: EvidenceStorage = localStorage) {
  try { storage.setItem(key(orderNumber), JSON.stringify(draft)); return true } catch { return false }
}

export function hasDamagePhoto(photos: EvidencePhoto[]) {
  return photos.some((photo) => photo.category === 'damage')
}

export function deliveryPhotoIssues(draft: DeliveryDraft) {
  if (!draft.damageReported) return draft.photos.length ? [] : ['Add a Delivery photo.']
  return [
    ...(!hasDamagePhoto(draft.photos) ? ['Add a damage photo.'] : []),
    ...(!draft.damageNote.trim() ? ['Describe the damage.'] : []),
  ]
}
