import { normalizeOrderNumber } from './cargoDomain'
import type { OrderEbol } from './orderEbolDomain'
import { saveWorkflowChange } from './syncQueueStore'

export const ORDER_EBOLS_STORAGE_KEY = 'zaberman-order-ebols:v2'

interface OrderEbolStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function isOrderEbol(value: unknown): value is OrderEbol {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<OrderEbol>
  return typeof candidate.orderNumber === 'string'
    && typeof candidate.status === 'string'
    && typeof candidate.pickup === 'object'
    && typeof candidate.delivery === 'object'
}

export function readOrderEbols(storage: OrderEbolStorage = localStorage): OrderEbol[] {
  try {
    const stored = storage.getItem(ORDER_EBOLS_STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isOrderEbol) : []
  } catch {
    return []
  }
}

export function writeOrderEbols(orderEbols: OrderEbol[], storage: OrderEbolStorage = localStorage) {
  try {
    storage.setItem(ORDER_EBOLS_STORAGE_KEY, JSON.stringify(orderEbols))
    return true
  } catch {
    return false
  }
}

export function saveSignedOrderEbol(order: OrderEbol, handoff: 'pickup' | 'delivery', version?: number) {
  const signed = version === undefined ? order[handoff] : order.pickupSupplements.find((item) => item.version === version)
  if (!signed?.lockedAt) return false
  try {
    saveWorkflowChange(ORDER_EBOLS_STORAGE_KEY, upsertOrderEbol(readOrderEbols(), order), {
      id: `signed:${handoff}:${order.orderNumber}:${version ?? 1}`,
      label: `${handoff === 'pickup' ? 'Pickup' : 'Delivery'} eBOL #${order.orderNumber}${version === undefined ? '' : ` · v${version}`}`,
      detail: signed.contact.status === 'follow_up' ? 'Signed · Contact confirmation pending' : 'Signed',
      recordedAt: signed.lockedAt,
    })
    return true
  } catch { return false }
}

export function upsertOrderEbol(orderEbols: OrderEbol[], orderEbol: OrderEbol) {
  const orderNumber = normalizeOrderNumber(orderEbol.orderNumber)
  const normalized = { ...orderEbol, orderNumber }
  return [
    normalized,
    ...orderEbols.filter((item) => normalizeOrderNumber(item.orderNumber) !== orderNumber),
  ]
}

export function findOrderEbol(orderEbols: OrderEbol[], orderNumber: string) {
  const normalized = normalizeOrderNumber(orderNumber)
  return orderEbols.find((orderEbol) => orderEbol.orderNumber === normalized)
}
