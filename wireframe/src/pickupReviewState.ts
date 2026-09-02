import type { OrderEbol } from './orderEbolDomain'
import { findDraftSupplementalPickup } from './orderEbolDomain'
import type { PickupDraft } from './pickupDraftDomain'

export function pickupReviewNeedsRefresh(order: OrderEbol | null | undefined, drafts: PickupDraft[]) {
  if (!order) return false
  const supplement = findDraftSupplementalPickup(order)
  const target = supplement ?? order.pickup
  if (target.lockedAt) return false
  const draft = drafts.find((item) => item.orderNumber === order.orderNumber
    && item.mode === (supplement ? 'supplemental' : 'standard'))
  return Boolean(draft && target.evidence?.sourceDraftUpdatedAt !== draft.updatedAt)
}
