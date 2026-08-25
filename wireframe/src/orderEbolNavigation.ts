import { isOrderPodAvailable, type OrderEbol } from './orderEbolDomain'

export type OrderDocumentNavigationState = 'pickup_review' | 'pickup_locked' | 'delivery_review' | 'pod_available'

export interface OrderDocumentNavigation {
  path: string
  state: OrderDocumentNavigationState
  statusLabel: string
  detailLabel: string
}

export function getOrderDocumentNavigation(orderEbol: OrderEbol): OrderDocumentNavigation {
  const basePath = `/orders/${orderEbol.orderNumber}/ebol`

  if (isOrderPodAvailable(orderEbol)) {
    return {
      path: `${basePath}/pod`,
      state: 'pod_available',
      statusLabel: 'POD available',
      detailLabel: 'Completed Order eBOL',
    }
  }

  if (orderEbol.delivery.evidence) {
    return {
      path: `${basePath}/delivery`,
      state: 'delivery_review',
      statusLabel: 'Delivery review',
      detailLabel: 'Order eBOL · Delivery',
    }
  }

  if (orderEbol.pickup.lockedAt) {
    return {
      path: `${basePath}/pickup`,
      state: 'pickup_locked',
      statusLabel: 'Pickup locked',
      detailLabel: 'Order eBOL · Pickup',
    }
  }

  return {
    path: `${basePath}/pickup`,
    state: 'pickup_review',
    statusLabel: 'Pickup review',
    detailLabel: 'Order eBOL · Pickup',
  }
}
