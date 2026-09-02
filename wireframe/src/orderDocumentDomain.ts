import type { OrderEbol, OrderEbolHandoffSnapshot } from './orderEbolDomain'

export interface OrderDocumentVersion {
  key: string
  documentNumber: string
  title: string
  snapshot: OrderEbolHandoffSnapshot
}

export function orderDocumentVersions(order: OrderEbol): OrderDocumentVersion[] {
  const versions: OrderDocumentVersion[] = []
  if (order.pickup.lockedAt && order.pickup.evidence) versions.push({
    key: 'pickup-1', documentNumber: `${order.orderNumber}-PU-1`, title: 'Version 1 · Original Pickup', snapshot: order.pickup,
  })
  for (const item of [...(order.pickupSupplements ?? [])].sort((a, b) => a.version - b.version)) {
    if (item.status === 'locked' && item.lockedAt && item.evidence) versions.push({
      key: `pickup-${item.version}`, documentNumber: item.documentNumber, title: `Version ${item.version} · Supplemental Pickup`, snapshot: item,
    })
  }
  if (order.delivery.lockedAt && order.delivery.evidence) versions.push({
    key: 'delivery', documentNumber: `${order.orderNumber}-DE-1`, title: 'Delivery confirmation', snapshot: order.delivery,
  })
  return versions
}

export function formatDocumentTime(value?: string) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
