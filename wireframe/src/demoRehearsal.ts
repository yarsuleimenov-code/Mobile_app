import { CARGO_RECORDS_STORAGE_KEY, initialCargoRecords, type CargoRecord } from './cargoDomain'
import { findPickupDemoRecord } from './pickupDemoData'
import { createPickupDraft } from './pickupDraftDomain'
import { PICKUP_DRAFTS_STORAGE_KEY, readPickupDrafts, upsertPickupDraft } from './pickupDraftStore'
import { createOrderEbol, lockPickupEbol, prepareDeliveryEbol, type OrderEbol } from './orderEbolDomain'
import { ORDER_EBOLS_STORAGE_KEY, readOrderEbols, upsertOrderEbol } from './orderEbolStore'
import { initialOrderDetails, ORDER_DETAILS_STORAGE_KEY, readOrderDetails } from './orderDetailsDomain'
import { demoPhotos } from './photoEvidenceDomain'
import { mockTodaySpokeRoute, type SpokeRoute } from './spokeDomain'
import { getOrderDocumentNavigation } from './orderEbolNavigation'

export const rehearsalPresets = [
  { id: 'normal', order: '99003001', source: '23343775', title: 'Normal Pickup', detail: '1 · Small order → Pickup → Dropoff → POD', start: 'pickup' },
  { id: 'multiple', order: '99007002', source: '23343778', title: 'Multiple dimension groups', detail: '2 · Edit Qty, add and remove groups; verify labels', start: 'pickup' },
  { id: 'offline', order: '99003002', source: '23343775', title: 'Offline + photo error', detail: '3 · Save → reopen → Online → Retry → Success', start: 'pickup' },
  { id: 'printer', order: '99007004', source: '23343775', title: 'Printer unavailable', detail: '4 · Preview retained selection; enable printer for print/reprint', start: 'labels' },
  { id: 'damage', order: '99007005', source: '23343782', title: 'Damage + OTP', detail: '5 · Review damage and comments; verify the contact by SMS code', start: 'review' },
  { id: 'supplemental', order: '99007006', source: '23343775', title: 'Locked Pickup + Supplemental', detail: '6 · Original is already signed; add places with fresh signatures', start: 'locked' },
  { id: 'otp', order: '99007008', source: '23343775', title: 'OTP Delivery', detail: '7 · Verify recipient by SMS code → driver signature → POD', start: 'otp' },
  { id: 'conflict', order: '99003003', source: '23343775', title: 'Draft conflict', detail: '8 · Sync → compare → Keep local changes; inspect order data', start: 'pickup' },
  { id: '40', order: '99003040', source: '23343775', title: '40 mock photos', detail: 'Optional large gallery', start: 'pickup' },
  { id: '100', order: '99003100', source: '23343775', title: '100 mock photos', detail: 'Optional large gallery', start: 'pickup' },
] as const
export type RehearsalPresetId = typeof rehearsalPresets[number]['id']
const SCENARIO_KEY = 'zaberman-prototype-scenarios:v1'
const ROUTE_KEY = 'zaberman-spoke-route:v1'
interface StorageAccess { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }

export function buildRehearsalPreset(id: RehearsalPresetId) {
  const preset = rehearsalPresets.find((item) => item.id === id)!
  const count = id === '40' ? 40 : id === '100' ? 100 : id === 'damage' ? 4 : 3
  const at = '2026-09-02T09:00:00.000Z'
  const source = findPickupDemoRecord(preset.source)!
  const record: CargoRecord = { ...source, orderNumber: preset.order, pickupDate: '09/02/2026',
    orderDetails: initialOrderDetails(preset.source), photoCount: count, photos: demoPhotos(preset.order, 'pickup', count) }
  let orderEbol: OrderEbol | undefined = preset.start === 'pickup' ? undefined : createOrderEbol(record, at)
  if (orderEbol && id === 'damage') {
    orderEbol = { ...orderEbol, pickup: { ...orderEbol.pickup,
      evidence: { ...orderEbol.pickup.evidence!, hasDamage: true, exceptionNote: 'Outer carton dented at the right corner; glass top inspected together.' },
      contact: { status: 'pending', signerName: 'Morgan Lee' }, driver: { status: 'pending', signerName: 'Chris Adams' },
      comments: { contact: 'Please keep the console upright.', driver: 'Corner photographed before loading.' },
    } }
  }
  // Historical fixture only. New operations still require explicit signatures.
  if (orderEbol && id === 'supplemental') orderEbol = lockPickupEbol(orderEbol, {
    contactMethod: 'signed', contactName: 'Morgan Lee', driverName: 'Chris Adams', hasDamage: false, exceptionNote: '',
    contactComment: 'Three chairs handed over.', driverComment: 'Count and packing checked.',
  }, at)
  if (orderEbol && id === 'otp') {
    orderEbol = lockPickupEbol(orderEbol, {
      contactMethod: 'signed', contactName: 'Michael Reed', driverName: 'Chris Adams', hasDamage: false, exceptionNote: '',
      contactComment: 'Cargo released for delivery.', driverComment: 'Pickup count and condition confirmed.',
    }, at)
    orderEbol = prepareDeliveryEbol(orderEbol, record, {
      photoCount: 2, photos: demoPhotos(preset.order, 'delivery', 2), hasDamage: false, exceptionNote: '',
    }, at)
  }
  return { preset, record, orderEbol, draft: createPickupDraft(record, 'NJ1', 'standard', at) }
}

export function installRehearsalPreset(id: RehearsalPresetId, storage: StorageAccess = localStorage) {
  const { preset, record, orderEbol, draft } = buildRehearsalPreset(id)
  const records = JSON.parse(storage.getItem(CARGO_RECORDS_STORAGE_KEY) ?? 'null') as CargoRecord[] | null
  const cargo = records ?? initialCargoRecords
  const drafts = readPickupDrafts(storage)
  const documents = readOrderEbols(storage)
  const existing = documents.find((item) => item.orderNumber === preset.order)
  const started = Boolean(existing || drafts.some((item) => item.orderNumber === preset.order) || cargo.some((item) => item.orderNumber === preset.order))
  const details = readOrderDetails(storage)
  const route = JSON.parse(storage.getItem(ROUTE_KEY) ?? 'null') as SpokeRoute | null
  const nextRoute = route ?? { ...mockTodaySpokeRoute, workDate: '09/02/2026' }
  const task = mockTodaySpokeRoute.tasks.find((item) => item.externalId === preset.source)!
  const writes = new Map<string, string>()
  if (!started) {
    writes.set(ORDER_DETAILS_STORAGE_KEY, JSON.stringify({ ...details, [preset.order]: record.orderDetails }))
    if (orderEbol) {
      writes.set(CARGO_RECORDS_STORAGE_KEY, JSON.stringify([record, ...cargo]))
      writes.set(ORDER_EBOLS_STORAGE_KEY, JSON.stringify(upsertOrderEbol(documents, orderEbol)))
    } else writes.set(PICKUP_DRAFTS_STORAGE_KEY, JSON.stringify(upsertPickupDraft(drafts, draft)))
  }
  if (!nextRoute.tasks.some((item) => item.externalId === preset.order)) writes.set(ROUTE_KEY, JSON.stringify({
    ...nextRoute, tasks: [...nextRoute.tasks, { ...task, stopId: `rehearsal-${preset.order}`, externalId: preset.order, sequence: nextRoute.tasks.length + 1 }],
  }))
  writes.set(SCENARIO_KEY, JSON.stringify({ branch: 'NJ1', role: id === 'conflict' ? 'dispatcher' : 'delivery',
    network: id === 'offline' ? 'offline' : 'online', syncOutcome: id === 'offline' ? 'retry' : id === 'conflict' ? 'conflict' : 'success',
    printOutcome: 'success', emailOutcome: 'success', smsOutcome: 'success', otpOutcome: 'success',
    devices: { camera: true, scanner: true, printer: id !== 'printer' } }))
  const previous = new Map([...writes.keys()].map((key) => [key, storage.getItem(key)]))
  try {
    for (const [key, value] of writes) storage.setItem(key, value)
  } catch {
    for (const [key, value] of previous) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value) } catch { /* Report failure; never navigate into a partial setup. */ }
    }
    throw new Error('Could not prepare the scenario. Check device storage and try again. Existing work was not reset.')
  }
  if (existing) return getOrderDocumentNavigation(existing).path
  return preset.start === 'labels' ? `/orders/${preset.order}/labels`
    : preset.start === 'review' || preset.start === 'locked' ? `/orders/${preset.order}/ebol/pickup`
    : preset.start === 'otp' ? `/orders/${preset.order}/ebol/delivery`
    : `/pickup?order=${preset.order}`
}
