import type { SpokeOperation, SpokeTask } from './spokeDomain'

export interface Coordinates { latitude: number; longitude: number }
export interface LocationFix extends Coordinates { accuracy: number; capturedAt: number }
export type LocationStatus = 'passed' | 'outside' | 'inaccurate' | 'stale' | 'denied' | 'unavailable' | 'missing_coordinates'
export interface VerificationPolicy { radius: number; maxAccuracy: number; maxAgeMs: number }
export const defaultVerificationPolicy: VerificationPolicy = { radius: 100, maxAccuracy: 50, maxAgeMs: 30_000 }
export interface HandoffVerification {
  checkedAt: string
  driver: string
  orderNumber: string
  operation: SpokeOperation
  stopId?: string
  address: string
  target?: Coordinates
  code: string
  scannedOrder?: string
  qr: 'matched' | 'wrong_order' | 'unknown'
  location: LocationStatus
  fix?: LocationFix
  distance?: number
  policy: VerificationPolicy
  overridden: boolean
  reason: string
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

export function verifyHandoff(input: {
  driver: string; orderNumber: string; operation: SpokeOperation; task?: SpokeTask
  code: string; labels: Array<{ placeId: string; orderNumber: string }>
  target?: Coordinates; fix?: LocationFix; error?: 'denied' | 'unavailable'; policy: VerificationPolicy
}, now = Date.now()): HandoffVerification {
  const code = input.code.trim().toUpperCase()
  // Resolve through the known label registry, never by extracting an OrderID from an arbitrary code.
  const scannedOrder = input.labels.find((place) => place.placeId.toUpperCase() === code)?.orderNumber
  const qr = !scannedOrder ? 'unknown' : scannedOrder === input.orderNumber ? 'matched' : 'wrong_order'
  const task = input.task?.externalId === input.orderNumber && input.task.operation === input.operation ? input.task : undefined
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
  return { checkedAt: new Date(now).toISOString(), driver: input.driver, orderNumber: input.orderNumber,
    operation: input.operation, stopId: task?.stopId, address: task?.address ?? '', target,
    code, scannedOrder, qr, location, fix, distance,
    policy: { radius: input.policy.radius, maxAccuracy: input.policy.maxAccuracy, maxAgeMs: input.policy.maxAgeMs }, overridden: false, reason: '' }
}

export function approveHandoff(check: HandoffVerification, reason = ''): HandoffVerification {
  if (check.qr === 'unknown') throw new Error('Code not recognized. Scan the label again.')
  const overridden = check.qr !== 'matched' || check.location !== 'passed'
  if (overridden && !reason.trim()) throw new Error('Enter a reason to continue after a warning.')
  return { ...check, overridden, reason: overridden ? reason.trim() : '' }
}

export function assertHandoffVerification(check: HandoffVerification | undefined, order: string, operation: SpokeOperation, driver: string, at: string) {
  // Previously signed fixtures/versions remain readable; new UI confirmations always supply a check.
  if (!check) return
  const age = Date.parse(at) - Date.parse(check.checkedAt)
  if (check.orderNumber !== order || check.operation !== operation || check.driver !== driver
    || !Number.isFinite(age) || age < 0 || age > check.policy.maxAgeMs) throw new Error('Repeat the QR and location check before confirming.')
  const approved = approveHandoff(check, check.reason)
  if (approved.overridden !== check.overridden) throw new Error('The warning must be acknowledged before confirming.')
}

export const locationMessages: Record<LocationStatus, string> = {
  passed: 'Location confirmed', outside: 'Your location does not match this stop.',
  inaccurate: 'Location not confirmed. GPS accuracy is insufficient for this zone.',
  stale: 'Location not confirmed. The coordinates are out of date.',
  denied: 'Location not confirmed. Allow location access and retry.',
  unavailable: 'Location not confirmed. Your current location is unavailable.',
  missing_coordinates: 'Distance cannot be checked. This stop has no coordinates.',
}
