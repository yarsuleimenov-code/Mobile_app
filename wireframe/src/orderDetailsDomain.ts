import type { Role } from './domain'

export interface OrderDetails {
  trade_name: string
  internal_name: string
  name_source: string
  special_cargo_type: '' | 'fragile' | 'oversized'
  special_cargo_details: string
  history: Array<{ at: string; role: Role; field: string; before: string; after: string }>
}
export type OrderDetailsEdit = Pick<OrderDetails, 'internal_name' | 'special_cargo_type' | 'special_cargo_details'>
export const specialCargoLabels = { '': 'None', fragile: 'Fragile', oversized: 'Oversized' }
const names: Record<string, [string, string]> = {
  '23343775': ['Restoration Collection — Windsor Dining Side Chair, Natural Oak Finish, Upholstered Linen Seat', 'Dining Chair'],
  '23343778': ['Living Room Collection — Three-seat Sofa and Matching Walnut Side Tables', 'Sofa / Side Table'],
  '23343780': ['Lounge Collection — Accent Chairs with Coordinating Upholstered Ottoman', 'Chair + Ottoman'],
  '23343782': ['Heritage Collection — Console Table with Removable Glass Top, Antique Brass Frame', 'Console Table'],
}
export function initialOrderDetails(order: string, title = ''): OrderDetails {
  const photoPreset = ['99003001', '99003002', '99003003', '99003040', '99003100'].includes(order)
  const [trade_name, internal_name] = names[photoPreset ? '23343775' : order] ?? [title, title]
  return { trade_name, internal_name, name_source: trade_name ? 'Order master' : 'Not received',
    special_cargo_type: order === '23343782' ? 'fragile' : order === '23343778' ? 'oversized' : '',
    special_cargo_details: order === '23343782' ? 'Glass top. Keep upright; protect corners.' : order === '23343778' ? 'Two-person lift. Check doorway clearance before moving the sofa.' : '', history: [] }
}
export function operationalName(details: OrderDetails, order: string) {
  return details.internal_name.trim() || details.trade_name.trim() || `Order #${order}`
}
export function canEditInternalName(role: Role, details: OrderDetails) {
  return role === 'dispatcher' || (role === 'supervisor' && !details.internal_name.trim())
}
export function orderDetailsIssues(details: OrderDetails) {
  const issues: string[] = []
  if (!details.internal_name.trim()) issues.push('Internal name is required before Pickup review.')
  if (details.internal_name.trim().length > 80) issues.push('Internal name must be 80 characters or fewer.')
  if (details.special_cargo_type && !details.special_cargo_details.trim()) issues.push('Handling details are required for Special Cargo.')
  return issues
}
export function editOrderDetails(current: OrderDetails, edit: OrderDetailsEdit, role: Role, at = new Date().toISOString()): OrderDetails {
  const next = { internal_name: edit.internal_name.trim(), special_cargo_type: edit.special_cargo_type,
    special_cargo_details: edit.special_cargo_details.trim() }
  if (next.internal_name.length > 80) throw new Error('Internal name must be 80 characters or fewer.')
  if (!Object.hasOwn(specialCargoLabels, next.special_cargo_type)) throw new Error('Select a valid Special Cargo type.')
  const fields = ['internal_name', 'special_cargo_type', 'special_cargo_details'] as const
  for (const field of fields) {
    if (next[field] !== current[field] && !(field === 'internal_name' ? canEditInternalName(role, current) : role === 'dispatcher')) {
      throw new Error('Your role cannot change this field.')
    }
  }
  return { ...current, ...next, history: [...current.history, ...fields.filter((field) => next[field] !== current[field])
    .map((field) => ({ at, role, field, before: current[field], after: next[field] }))] }
}
export const ORDER_DETAILS_STORAGE_KEY = 'zaberman-order-details:v1'
export function readOrderDetails(): Record<string, OrderDetails> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ORDER_DETAILS_STORAGE_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, item]) => item
      && typeof item.internal_name === 'string' && typeof item.trade_name === 'string'
      && typeof item.name_source === 'string' && typeof item.special_cargo_details === 'string'
      && Object.hasOwn(specialCargoLabels, item.special_cargo_type) && Array.isArray(item.history)))
  } catch { return {} }
}
