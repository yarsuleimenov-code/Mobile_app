import { calculatePieces, calculateVolume, expandCargoPlaces, type CargoChangeEntry, type CargoRecord } from './cargoDomain'
import { evidencePhotos, type EvidencePhoto } from './photoEvidenceDomain'

export type OrderEbolStatus =
  | 'draft'
  | 'pickup_review'
  | 'pickup_locked'
  | 'in_transit'
  | 'delivery_review'
  | 'completed'
  | 'correction_requested'

export type OrderEbolContactConfirmationStatus = 'pending' | 'signed' | 'contactless'
export type OrderEbolDriverConfirmationStatus = 'pending' | 'signed'

interface OrderEbolConfirmationDetails {
  signerName?: string
  confirmedAt?: string
}

export interface OrderEbolContactConfirmation extends OrderEbolConfirmationDetails {
  status: OrderEbolContactConfirmationStatus
  contactlessReason?: string
}

export interface OrderEbolDriverConfirmation extends OrderEbolConfirmationDetails {
  status: OrderEbolDriverConfirmationStatus
}

export interface OrderEbolEvidenceSnapshot {
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
    createdAt: orderEbol.createdAt,
  } : draft
}
export interface PickupEbolConfirmationInput {
  contactMethod: 'signed' | 'contactless'
  contactName: string
  contactlessReason: string
  contactlessAcknowledged: boolean
  driverName: string
  hasDamage: boolean
  exceptionNote: string
}

export function canLockPickupEbol(input: PickupEbolConfirmationInput) {
  const contactIsComplete = input.contactMethod === 'contactless'
    ? Boolean(input.contactlessReason.trim()) && input.contactlessAcknowledged
    : Boolean(input.contactName.trim())
  const exceptionIsComplete = !input.hasDamage || Boolean(input.exceptionNote.trim())
  return contactIsComplete && Boolean(input.driverName.trim()) && exceptionIsComplete
}

export function lockPickupEbol(
  orderEbol: OrderEbol,
  input: PickupEbolConfirmationInput,
  lockedAt = new Date().toISOString(),
): OrderEbol {
  if (!canLockPickupEbol(input)) throw new Error('Pickup eBOL confirmation is incomplete')

  return {
    ...orderEbol,
    status: 'pickup_locked',
    pickup: {
      ...orderEbol.pickup,
      evidence: orderEbol.pickup.evidence ? {
        ...orderEbol.pickup.evidence,
        hasDamage: input.hasDamage,
        exceptionNote: input.hasDamage ? input.exceptionNote.trim() : '',
      } : null,
      contact: input.contactMethod === 'contactless'
        ? { status: 'contactless', contactlessReason: input.contactlessReason.trim(), confirmedAt: lockedAt }
        : { status: 'signed', signerName: input.contactName.trim(), confirmedAt: lockedAt },
      driver: { status: 'signed', signerName: input.driverName.trim(), confirmedAt: lockedAt },
      lockedAt,
    },
    updatedAt: lockedAt,
  }
}

export interface SupplementalPickupInput {
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
    addedPlaceIds: [...input.addedPlaceIds],
    evidence: {
      capturedAt,
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
  if (!target || target.status !== 'draft' || !target.evidence) throw new Error('Supplemental Pickup draft is missing')
  return {
    ...orderEbol,
    pickupSupplements: supplements.map((item) => item.version !== version ? item : {
      ...item,
      status: 'locked',
      evidence: {
        ...item.evidence!,
        hasDamage: input.hasDamage,
        exceptionNote: input.hasDamage ? input.exceptionNote.trim() : '',
      },
      contact: input.contactMethod === 'contactless'
        ? { status: 'contactless', contactlessReason: input.contactlessReason.trim(), confirmedAt: lockedAt }
        : { status: 'signed', signerName: input.contactName.trim(), confirmedAt: lockedAt },
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
  const photos = evidencePhotos(input, orderEbol.orderNumber, 'delivery')
  if (!photos.length) throw new Error('Delivery evidence requires at least one photo')
  if (input.hasDamage && !input.exceptionNote.trim()) {
    throw new Error('Delivery damage exception requires a note')
  }

  return {
    ...orderEbol,
    status: 'delivery_review',
    delivery: {
      evidence: {
        capturedAt,
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
  if (!orderEbol.pickup.lockedAt) throw new Error('Pickup eBOL must be locked before Delivery')
  if (!orderEbol.delivery.evidence) throw new Error('Delivery evidence is missing')
  if (!canLockDeliveryEbol(input)) throw new Error('Delivery eBOL confirmation is incomplete')

  return {
    ...orderEbol,
    status: 'completed',
    delivery: {
      ...orderEbol.delivery,
      evidence: {
        ...orderEbol.delivery.evidence,
        hasDamage: input.hasDamage,
        exceptionNote: input.hasDamage ? input.exceptionNote.trim() : '',
      },
      contact: input.contactMethod === 'contactless'
        ? { status: 'contactless', contactlessReason: input.contactlessReason.trim(), confirmedAt: lockedAt }
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
