import { calculatePieces, calculateVolume, expandCargoPlaces, type CargoRecord } from './cargoDomain'

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
  hasDamage: boolean
  exceptionNote: string
}

export interface OrderEbolHandoffSnapshot {
  evidence: OrderEbolEvidenceSnapshot | null
  contact: OrderEbolContactConfirmation
  driver: OrderEbolDriverConfirmation
  lockedAt?: string
}

export interface OrderEbol {
  orderNumber: string
  status: OrderEbolStatus
  pickup: OrderEbolHandoffSnapshot
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
        photoCount: record.photoCount,
        hasDamage: false,
        exceptionNote: '',
      },
      contact: pendingContactConfirmation(),
      driver: pendingDriverConfirmation(),
    },
    delivery: emptyHandoff(),
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
export interface DeliveryEbolEvidenceInput {
  photoCount: number
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
  if (input.photoCount < 1) throw new Error('Delivery evidence requires at least one photo')
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
        placeIds: orderEbol.pickup.evidence?.placeIds ?? expandCargoPlaces(record).map((place) => place.placeId),
        totalWeight: record.totalWeight,
        totalVolume: calculateVolume(record.dimensionGroups),
        photoCount: input.photoCount,
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
