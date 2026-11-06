import type { SpokeOperation, SpokeTask } from './spokeDomain'
import { normalizePlaceCode } from './placeScanDomain'

export interface Coordinates { latitude: number; longitude: number }
export interface LocationFix extends Coordinates { accuracy: number; capturedAt: number }
export type LocationStatus = 'passed' | 'outside' | 'inaccurate' | 'stale' | 'denied' | 'unavailable' | 'missing_coordinates'
export interface VerificationPolicy { radius: number; maxAccuracy: number; maxAgeMs: number }
export const defaultVerificationPolicy: VerificationPolicy = { radius: 100, maxAccuracy: 50, maxAgeMs: 30_000 }
export interface LabelLocationCheck {
  checkedAt: string
  stopId?: string
  address: string
  target?: Coordinates
  location: LocationStatus
  fix?: LocationFix
  distance?: number
  policy: VerificationPolicy
}
export interface HandoffVerification extends LabelLocationCheck {
  driver?: string
  orderNumber: string
  operation: SpokeOperation
  code: string
  scannedOrder?: string
  qr: 'matched' | 'wrong_order' | 'unknown'
  overridden?: boolean
  reason?: string
}

export function hasRecordedLabelLocation(check: LabelLocationCheck) {
  return check.location === 'passed' || (check.location === 'missing_coordinates' && Boolean(check.fix))
}

export function validCoordinates(value?: Coordinates): value is Coordinates {
  return Boolean(value && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90
    && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180)
}

export function distanceMeters(a: Coordinates, b: Coordinates) {
  const radians = Math.PI / 180
  const h = Math.sin((b.latitude - a.latitude) * radians / 2) ** 2
    + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians)
    * Math.sin((b.longitude - a.longitude) * radians / 2) ** 2
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)))
}

export function checkLabelLocation(input: {
  task?: SpokeTask
  target?: Coordinates; fix?: LocationFix; error?: 'denied' | 'unavailable'; policy: VerificationPolicy
}, now = Date.now()): LabelLocationCheck {
  const { task } = input
  const target = task?.address.trim() && validCoordinates(input.target) ? input.target : undefined
  const fix = input.fix
  const distance = target && fix && validCoordinates(fix) ? distanceMeters(fix, target) : undefined
  let location: LocationStatus
  if (!target) location = 'missing_coordinates'
  else if (input.error) location = input.error
  else if (!fix || !validCoordinates(fix) || !Number.isFinite(fix.accuracy) || fix.accuracy < 0) location = 'unavailable'
  else if (!Number.isFinite(fix.capturedAt) || now - fix.capturedAt > input.policy.maxAgeMs || fix.capturedAt > now + 1000) location = 'stale'
  else if (fix.accuracy > input.policy.maxAccuracy) location = 'inaccurate'
  else if (distance! > input.policy.radius) location = 'outside'
  else if (distance! + fix.accuracy > input.policy.radius) location = 'inaccurate'
  else location = 'passed'
  return { checkedAt: new Date(now).toISOString(), stopId: task?.stopId, address: task?.address ?? '', target,
    location, fix, distance,
    policy: { radius: input.policy.radius, maxAccuracy: input.policy.maxAccuracy, maxAgeMs: input.policy.maxAgeMs } }
}

export function verifyHandoff(input: Parameters<typeof checkLabelLocation>[0] & {
  orderNumber: string; operation: SpokeOperation; code: string
  labels: Array<{ placeId: string; orderNumber: string }>
}, now = Date.now()): HandoffVerification {
  const code = normalizePlaceCode(input.code)
  // Resolve through the label registry instead of inferring an order from the code.
  const scannedOrder = input.labels.find((place) => place.placeId.toUpperCase() === code)?.orderNumber
  const qr = !scannedOrder ? 'unknown' : scannedOrder === input.orderNumber ? 'matched' : 'wrong_order'
  const task = input.task?.externalId === input.orderNumber && input.task.operation === input.operation ? input.task : undefined
  return { ...checkLabelLocation({ ...input, task }, now), orderNumber: input.orderNumber, operation: input.operation, code, scannedOrder, qr }
}

export const locationMessages: Record<LocationStatus, string> = {
  passed: 'Location confirmed', outside: 'Your location does not match this stop.',
  inaccurate: 'Location not confirmed. GPS accuracy is insufficient for this zone.',
  stale: 'Location not confirmed. The coordinates are out of date.',
  denied: 'Location not confirmed. Allow location access and retry.',
  unavailable: 'Location not confirmed. Your current location is unavailable.',
  missing_coordinates: 'Distance cannot be checked. This stop has no coordinates.',
}
