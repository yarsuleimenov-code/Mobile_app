import type { PickupDraft, PickupDraftMode } from './pickupDraftDomain'

export const PICKUP_DRAFTS_STORAGE_KEY = 'zaberman-pickup-drafts:v1'

interface PickupDraftStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function isPickupDraft(value: unknown): value is PickupDraft {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PickupDraft>
  return typeof candidate.orderNumber === 'string'
    && (candidate.mode === 'standard' || candidate.mode === 'supplemental')
    && Array.isArray(candidate.places)
    && Array.isArray(candidate.history)
}

export function readPickupDrafts(storage: PickupDraftStorage = localStorage): PickupDraft[] {
  try {
    const stored = storage.getItem(PICKUP_DRAFTS_STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isPickupDraft) : []
  } catch {
    return []
  }
}

export function writePickupDrafts(drafts: PickupDraft[], storage: PickupDraftStorage = localStorage) {
  try {
    storage.setItem(PICKUP_DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
    return true
  } catch {
    return false
  }
}

export function upsertPickupDraft(drafts: PickupDraft[], draft: PickupDraft) {
  return [
    draft,
    ...drafts.filter((item) => item.orderNumber !== draft.orderNumber || item.mode !== draft.mode),
  ]
}

export function findPickupDraft(drafts: PickupDraft[], orderNumber: string, mode: PickupDraftMode) {
  return drafts.find((draft) => draft.orderNumber === orderNumber && draft.mode === mode)
}

export function removePickupDraft(drafts: PickupDraft[], orderNumber: string, mode: PickupDraftMode) {
  return drafts.filter((draft) => draft.orderNumber !== orderNumber || draft.mode !== mode)
}
