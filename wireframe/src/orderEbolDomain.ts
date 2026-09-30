import { calculatePieces, calculateVolume, expandCargoPlaces, type CargoChangeEntry, type CargoRecord } from './cargoDomain'
import { orderDetailsIssues, initialOrderDetails, type OrderDetails } from './orderDetailsDomain'
import { summarizeMeasurements, type MeasurementSummary } from './measurementDomain'
import { evidencePhotos, type EvidencePhoto } from './photoEvidenceDomain'

export type OrderEbolStatus =
  | 'draft'
  | 'pickup_review'
  | 'pickup_locked'
  | 'in_transit'
  | 'delivery_review'
  | 'completed'
  | 'correction_requested'

export type OrderEbolContactConfirmationStatus = 'pending' | 'signed' | 'otp'
export type OrderEbolDriverConfirmationStatus = 'pending' | 'signed'

interface OrderEbolConfirmationDetails {
  signerName?: string
  confirmedAt?: string
}

export interface OrderEbolContactConfirmation extends OrderEbolConfirmationDetails {
  status: OrderEbolContactConfirmationStatus
  otpPhoneLast4?: string
  emailCopyRequest?: { recipientEmail: string; requestedAt: string }
}

export interface OrderEbolDriverConfirmation extends OrderEbolConfirmationDetails {
  status: OrderEbolDriverConfirmationStatus
}

export interface OrderEbolEvidenceSnapshot {
  sourceDraftUpdatedAt?: string
  orderDetails?: OrderDetails
  measurements?: MeasurementSummary
  capturedAt: string
  pieceCount: number
  placeIds: string[]
  totalWeight: number
  totalVolume: number
  photoCount: number
  photos?: EvidencePhoto[]
  hasDamage: boolean
  exceptionNote: string
  changeHistory?: CargoChangeEntry[]
}

export interface OrderEbolHandoffSnapshot {
  evidence: OrderEbolEvidenceSnapshot | null
  comments?: HandoffComments
  contact: OrderEbolContactConfirmation
  driver: OrderEbolDriverConfirmation
  lockedAt?: string
}

export interface SupplementalPickupVersion extends OrderEbolHandoffSnapshot {
  version: number
  documentNumber: string
  status: 'draft' | 'locked'
  addedPlaceIds: string[]
  createdAt: string
}

export interface OrderEbol {
  orderNumber: string
  status: OrderEbolStatus
  pickup: OrderEbolHandoffSnapshot
  pickupSupplements: SupplementalPickupVersion[]
  delivery: OrderEbolHandoffSnapshot
  createdAt: string
  updatedAt: string
}

function pendingContactConfirmation(): OrderEbolContactConfirmation {
  return { status: 'pending' }
}

function pendingDriverConfirmation(): OrderEbolDriverConfirmation {
  return { status: 'pending' }
}

function emptyHandoff(): OrderEbolHandoffSnapshot {
  return {
    evidence: null,
    contact: pendingContactConfirmation(),
    driver: pendingDriverConfirmation(),
  }
}

export function createOrderEbol(record: CargoRecord, capturedAt = new Date().toISOString()): OrderEbol {
  const photos = evidencePhotos(record, record.orderNumber, 'pickup')
  return {
    orderNumber: record.orderNumber,
    status: 'pickup_review',
    pickup: {
      evidence: {
        capturedAt,
        orderDetails: structuredClone(record.orderDetails ?? initialOrderDetails(record.orderNumber, record.title)),
        measurements: summarizeMeasurements(record.dimensionGroups),
        pieceCount: calculatePieces(record.dimensionGroups),
        placeIds: expandCargoPlaces(record).map((place) => place.placeId),
        totalWeight: record.totalWeight,
        totalVolume: calculateVolume(record.dimensionGroups),
        photoCount: photos.length,
        photos,
        hasDamage: false,
        exceptionNote: '',
        changeHistory: record.changeHistory ?? [],
      },
      contact: pendingContactConfirmation(),
      driver: pendingDriverConfirmation(),
    },
    delivery: emptyHandoff(),
    pickupSupplements: [],
    createdAt: capturedAt,
    updatedAt: capturedAt,
  }
}

export function syncPickupOrderEbolDraft(
  orderEbol: OrderEbol | undefined,
  record: CargoRecord,
  capturedAt = new Date().toISOString(),
): OrderEbol {
  if (orderEbol?.pickup.lockedAt) return orderEbol

  const draft = createOrderEbol(record, capturedAt)
  return orderEbol ? {
    ...draft,
    pickup: { ...draft.pickup, comments: orderEbol.pickup.comments,
      evidence: { ...draft.pickup.evidence!, hasDamage: orderEbol.pickup.evidence?.hasDamage ?? false,
        exceptionNote: orderEbol.pickup.evidence?.exceptionNote ?? '' } },
    createdAt: orderEbol.createdAt,
  } : draft
}
export interface PickupEbolConfirmationInput {
  contactComment?: string
  driverComment?: string
  contactMethod: 'signed' | 'otp'
  contactName: string
  otpVerified?: boolean
  otpPhoneLast4?: string
  driverName: string
  hasDamage: boolean
  exceptionNote: string
  sendEmailCopy?: boolean
  contactEmail?: string
}

export function isValidContactEmail(value: string) {
  const email = value.trim()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function canLockPickupEbol(input: PickupEbolConfirmationInput) {
  const contactIsComplete = input.contactMethod === 'otp'
    ? Boolean(input.contactName.trim()) && Boolean(input.otpVerified) && /^\d{4}$/.test(input.otpPhoneLast4 ?? '')
    : Boolean(input.contactName.trim())
  const exceptionIsComplete = !input.hasDamage || Boolean(input.exceptionNote.trim())
  const emailIsComplete = !input.sendEmailCopy || (input.contactMethod === 'signed' && isValidContactEmail(input.contactEmail ?? ''))
  return contactIsComplete && Boolean(input.driverName.trim()) && exceptionIsComplete && emailIsComplete
}

export function lockPickupEbol(
  orderEbol: OrderEbol,
  input: PickupEbolConfirmationInput,
  lockedAt = new Date().toISOString(),
): OrderEbol {
  if (orderEbol.pickup.lockedAt) throw new Error('Pickup eBOL is already locked')
  if (!canLockPickupEbol(input) || !canReviewOrderEvidence(orderEbol.pickup.evidence)) throw new Error('Pickup eBOL confirmation is incomplete')

  return {
    ...orderEbol,
    status: 'pickup_locked',
    pickup: {
      ...orderEbol.pickup,
      comments: confirmedComments(input, orderEbol.pickup.comments),
      evidence: orderEbol.pickup.evidence ? {
        ...orderEbol.pickup.evidence,
        hasDamage: input.hasDamage,
        exceptionNote: input.hasDamage ? input.exceptionNote.trim() : '',
      } : null,
      contact: input.contactMethod === 'otp'
        ? { status: 'otp', signerName: input.contactName.trim(), otpPhoneLast4: input.otpPhoneLast4, confirmedAt: lockedAt }
        : { status: 'signed', signerName: input.contactName.trim(), confirmedAt: lockedAt,
          ...(input.sendEmailCopy ? { emailCopyRequest: { recipientEmail: input.contactEmail!.trim(), requestedAt: lockedAt } } : {}) },
      driver: { status: 'signed', signerName: input.driverName.trim(), confirmedAt: lockedAt },
      lockedAt,
    },
    updatedAt: lockedAt,
  }
}

export interface SupplementalPickupInput {
  orderDetails?: OrderDetails
  measurements?: MeasurementSummary
  addedPlaceIds: string[]
  totalWeight: number
  totalVolume: number
  photoCount: number
  photos?: EvidencePhoto[]
  changeHistory: CargoChangeEntry[]
}

export function prepareSupplementalPickup(
  orderEbol: OrderEbol,
  input: SupplementalPickupInput,
  capturedAt = new Date().toISOString(),
): OrderEbol {
  if (!orderEbol.pickup.lockedAt) throw new Error('Original Pickup must be locked before Supplemental Pickup')
  if (!input.addedPlaceIds.length) throw new Error('Supplemental Pickup requires at least one added place')
  const supplements = orderEbol.pickupSupplements ?? []
  const existingDraft = supplements.find((item) => item.status === 'draft')
  const version = existingDraft?.version
    ?? Math.max(1, ...supplements.filter((item) => item.status === 'locked').map((item) => item.version)) + 1
  const photos = evidencePhotos(input, orderEbol.orderNumber, 'pickup', `supplement-${version}`)
  const supplemental: SupplementalPickupVersion = {
    version,
    documentNumber: `${orderEbol.orderNumber}-PU-${version}`,
    status: 'draft',
    comments: existingDraft?.comments,
    addedPlaceIds: [...input.addedPlaceIds],
    evidence: {
      capturedAt,
      orderDetails: input.orderDetails ? structuredClone(input.orderDetails) : undefined,
      measurements: input.measurements ? structuredClone(input.measurements) : undefined,
      pieceCount: input.addedPlaceIds.length,
      placeIds: [...input.addedPlaceIds],
      totalWeight: input.totalWeight,
      totalVolume: input.totalVolume,
      photoCount: photos.length,
      photos,
      hasDamage: false,
      exceptionNote: '',
      changeHistory: input.changeHistory,
    },
    contact: pendingContactConfirmation(),
    driver: pendingDriverConfirmation(),
    createdAt: existingDraft?.createdAt ?? capturedAt,
  }
  return {
    ...orderEbol,
    pickupSupplements: [supplemental, ...supplements.filter((item) => item.status !== 'draft')],
    updatedAt: capturedAt,
  }
}

export function findDraftSupplementalPickup(orderEbol: OrderEbol | null | undefined) {
  return orderEbol?.pickupSupplements?.find((item) => item.status === 'draft')
}

export function lockSupplementalPickup(
  orderEbol: OrderEbol,
  version: number,
  input: PickupEbolConfirmationInput,
  lockedAt = new Date().toISOString(),
): OrderEbol {
  if (!canLockPickupEbol(input)) throw new Error('Supplemental Pickup confirmation is incomplete')
  const supplements = orderEbol.pickupSupplements ?? []
  const target = supplements.find((item) => item.version === version)
  if (!target || target.status !== 'draft' || !target.evidence || !canReviewOrderEvidence(target.evidence)) throw new Error('Supplemental Pickup draft is missing')
  return {
    ...orderEbol,
    pickupSupplements: supplements.map((item) => item.version !== version ? item : {
      ...item,
      status: 'locked',
      comments: confirmedComments(input, item.comments),
      evidence: {
        ...item.evidence!,
        hasDamage: input.hasDamage,
        exceptionNote: input.hasDamage ? input.exceptionNote.trim() : '',
      },
      contact: input.contactMethod === 'otp'
        ? { status: 'otp', signerName: input.contactName.trim(), otpPhoneLast4: input.otpPhoneLast4, confirmedAt: lockedAt }
        : { status: 'signed', signerName: input.contactName.trim(), confirmedAt: lockedAt,
          ...(input.sendEmailCopy ? { emailCopyRequest: { recipientEmail: input.contactEmail!.trim(), requestedAt: lockedAt } } : {}) },
      driver: { status: 'signed', signerName: input.driverName.trim(), confirmedAt: lockedAt },
      lockedAt,
    }),
    updatedAt: lockedAt,
  }
}

export function getEffectivePickupPlaceIds(orderEbol: OrderEbol) {
  return [
    ...(orderEbol.pickup.evidence?.placeIds ?? []),
    ...(orderEbol.pickupSupplements ?? [])
      .filter((item) => item.status === 'locked')
      .flatMap((item) => item.addedPlaceIds),
  ]
}
export interface DeliveryEbolEvidenceInput {
  photoCount: number
  photos?: EvidencePhoto[]
  hasDamage: boolean
  exceptionNote: string
}

export type DeliveryEbolConfirmationInput = PickupEbolConfirmationInput

export function prepareDeliveryEbol(
  orderEbol: OrderEbol,
  record: CargoRecord,
  input: DeliveryEbolEvidenceInput,
  capturedAt = new Date().toISOString(),
): OrderEbol {
  if (!orderEbol.pickup.lockedAt) throw new Error('Pickup eBOL must be locked before Delivery')
  if (orderEbol.delivery.lockedAt) throw new Error('Delivery eBOL is already locked')
  if (orderEbol.orderNumber !== record.orderNumber) throw new Error('Delivery order does not match eBOL')
  if (findDraftSupplementalPickup(orderEbol)) throw new Error('Sign the Supplemental Pickup before Delivery.')
  const signedIds = new Set(getEffectivePickupPlaceIds(orderEbol))
  const cargoIds = expandCargoPlaces(record).map((place) => place.placeId)
  if (signedIds.size && (signedIds.size !== cargoIds.length || cargoIds.some((id) => !signedIds.has(id)))) {
    throw new Error('Cargo differs from the signed Pickup. Complete its Supplemental Pickup before Delivery.')
  }
  const photos = evidencePhotos(input, orderEbol.orderNumber, 'delivery')
  if (!photos.length) throw new Error('Delivery evidence requires at least one photo')
  if (input.hasDamage && !input.exceptionNote.trim()) {
    throw new Error('Delivery damage exception requires a note')
  }

  return {
    ...orderEbol,
    status: 'delivery_review',
    delivery: {
      comments: orderEbol.delivery.comments,
      evidence: {
        capturedAt,
        orderDetails: structuredClone(record.orderDetails ?? initialOrderDetails(record.orderNumber, record.title)),
        measurements: summarizeMeasurements(record.dimensionGroups),
        pieceCount: calculatePieces(record.dimensionGroups),
        placeIds: getEffectivePickupPlaceIds(orderEbol).length
          ? getEffectivePickupPlaceIds(orderEbol)
          : expandCargoPlaces(record).map((place) => place.placeId),
        totalWeight: record.totalWeight,
        totalVolume: calculateVolume(record.dimensionGroups),
        photoCount: photos.length,
        photos,
        hasDamage: input.hasDamage,
        exceptionNote: input.hasDamage ? input.exceptionNote.trim() : '',
      },
      contact: pendingContactConfirmation(),
      driver: pendingDriverConfirmation(),
    },
    updatedAt: capturedAt,
  }
}

export function canLockDeliveryEbol(input: DeliveryEbolConfirmationInput) {
  return canLockPickupEbol(input)
}

export function lockDeliveryEbol(
  orderEbol: OrderEbol,
  input: DeliveryEbolConfirmationInput,
  lockedAt = new Date().toISOString(),
): OrderEbol {
  if (orderEbol.delivery.lockedAt) throw new Error('Delivery eBOL is already locked')
  if (!orderEbol.pickup.lockedAt) throw new Error('Pickup eBOL must be locked before Delivery')
  if (!orderEbol.delivery.evidence) throw new Error('Delivery evidence is missing')
  if (!canLockDeliveryEbol(input) || !canReviewOrderEvidence(orderEbol.delivery.evidence)) throw new Error('Delivery eBOL confirmation is incomplete')

  return {
    ...orderEbol,
    status: 'completed',
    delivery: {
      ...orderEbol.delivery,
      comments: confirmedComments(input, orderEbol.delivery.comments),
      evidence: {
        ...orderEbol.delivery.evidence,
        hasDamage: input.hasDamage,
        exceptionNote: input.hasDamage ? input.exceptionNote.trim() : '',
      },
      contact: input.contactMethod === 'otp'
        ? { status: 'otp', signerName: input.contactName.trim(), otpPhoneLast4: input.otpPhoneLast4, confirmedAt: lockedAt }
        : { status: 'signed', signerName: input.contactName.trim(), confirmedAt: lockedAt },
      driver: { status: 'signed', signerName: input.driverName.trim(), confirmedAt: lockedAt },
      lockedAt,
    },
    updatedAt: lockedAt,
  }
}
export function isOrderPodAvailable(orderEbol: OrderEbol | null | undefined) {
  return orderEbol?.status === 'completed'
    && Boolean(orderEbol.pickup.evidence)
    && Boolean(orderEbol.pickup.lockedAt)
    && Boolean(orderEbol.delivery.evidence)
    && Boolean(orderEbol.delivery.lockedAt)
}

export function canReviewOrderEvidence(evidence: OrderEbolEvidenceSnapshot | null | undefined) {
  return Boolean(evidence && evidence.pieceCount > 0 && evidence.photoCount > 0) && (!evidence?.orderDetails || !orderDetailsIssues(evidence.orderDetails).length)
    && !evidence?.measurements?.reasons.some((item) => !item.reason.trim())
}

export function withCurrentOrderDetails(order: OrderEbol | null, target: HandoffTarget, details: OrderDetails): OrderEbol | null {
  if (!order) return null
  const snapshot = handoffSnapshot(order, target)
  if (!snapshot?.evidence || snapshot.lockedAt) return order
  const next = { ...snapshot, evidence: { ...snapshot.evidence, orderDetails: structuredClone(details) } }
  return typeof target === 'number'
    ? { ...order, pickupSupplements: order.pickupSupplements.map((item) => item.version === target ? { ...item, evidence: next.evidence } : item) }
    : { ...order, [target]: next }
}

export interface HandoffComments { contact: string; driver: string }
export type HandoffTarget = 'pickup' | 'delivery' | number

function confirmedComments(input: Pick<PickupEbolConfirmationInput, 'contactComment' | 'driverComment'>, previous?: HandoffComments): HandoffComments {
  return { contact: (input.contactComment ?? previous?.contact ?? '').trim(), driver: (input.driverComment ?? previous?.driver ?? '').trim() }
}

export function handoffSnapshot(orderEbol: OrderEbol, target: HandoffTarget) {
  return typeof target === 'number'
    ? orderEbol.pickupSupplements?.find((item) => item.version === target)
    : orderEbol[target]
}

export function updateHandoffComments(orderEbol: OrderEbol, target: HandoffTarget, comments: HandoffComments, updatedAt = new Date().toISOString()): OrderEbol {
  const snapshot = handoffSnapshot(orderEbol, target)
  if (!snapshot?.evidence || snapshot.lockedAt) return orderEbol
  const next = { ...snapshot, comments: { ...comments } }
  return typeof target === 'number'
    ? { ...orderEbol, updatedAt, pickupSupplements: orderEbol.pickupSupplements.map((item) => item.version === target ? { ...item, comments: next.comments } : item) }
    : { ...orderEbol, updatedAt, [target]: next }
}
