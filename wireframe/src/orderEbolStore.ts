import { normalizeOrderNumber } from './cargoDomain'
import type { OrderEbol } from './orderEbolDomain'

export const ORDER_EBOLS_STORAGE_KEY = 'zaberman-order-ebols:v1'

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
