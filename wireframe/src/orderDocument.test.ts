import { describe, expect, it } from 'vitest'
import { initialCargoRecords } from './cargoDomain'
import {
  canLockPickupEbol, canLockDeliveryEbol, createOrderEbol, lockPickupEbol, lockDeliveryEbol,
  prepareSupplementalPickup, lockSupplementalPickup, prepareDeliveryEbol, syncPickupOrderEbolDraft,
  updateHandoffComments, type PickupEbolConfirmationInput,
} from './orderEbolDomain'
import { orderDocumentVersions } from './orderDocumentDomain'
import { readOrderEbols, writeOrderEbols } from './orderEbolStore'

const record = initialCargoRecords[0]
const input: PickupEbolConfirmationInput = {
  contactMethod: 'signed', contactName: 'Morgan Lee',
  driverName: 'Chris Adams', hasDamage: false, exceptionNote: '',
}
const comments = { contact: 'Protect the top panel', driver: 'Corners padded before loading' }
const supplementInput = { addedPlaceIds: ['ZB-EXTRA-01'], totalWeight: 18, totalVolume: 3, photoCount: 1, changeHistory: [] }
const deliveryInput = { photoCount: 2, hasDamage: false, exceptionNote: '' }
const pickup = () => lockPickupEbol(createOrderEbol(record), { ...input, contactComment: comments.contact, driverComment: comments.driver })

describe('Order eBOL comments and document versions', () => {
  it.each(['pickup', 'delivery', 2] as const)('keeps sequential party comments on target %s through signing and refresh', (target) => {
    const original = target === 'pickup' ? createOrderEbol(record) : target === 'delivery' ? prepareDeliveryEbol(pickup(), record, deliveryInput) : prepareSupplementalPickup(pickup(), supplementInput)
    const first = updateHandoffComments(original, target, { contact: 'Contact wrote this', driver: '' })
    const second = updateHandoffComments(first, target, { contact: 'Contact wrote this', driver: 'Driver wrote this' })
    const confirmation = { ...input, contactComment: 'Contact wrote this', driverComment: 'Driver wrote this' }
    const locked = target === 'pickup' ? lockPickupEbol(second, confirmation) : target === 'delivery' ? lockDeliveryEbol(second, confirmation) : lockSupplementalPickup(second, target, confirmation)
    const version = orderDocumentVersions(locked).find((item) => item.key === (target === 'pickup' ? 'pickup-1' : target === 'delivery' ? 'delivery' : 'pickup-2'))!
    expect(version.snapshot.comments).toEqual({ contact: 'Contact wrote this', driver: 'Driver wrote this' })
    expect(updateHandoffComments(locked, target, { contact: 'Overwrite', driver: 'Overwrite' })).toBe(locked)
    if (target !== 'pickup') expect(locked.pickup).toEqual(original.pickup)
    let stored = ''
    const storage = { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value } }
    expect(writeOrderEbols([locked], storage)).toBe(true)
    expect(orderDocumentVersions(readOrderEbols(storage)[0])).toEqual(orderDocumentVersions(locked))
  })

  it('keeps ordinary comments optional and does not substitute them for exception details', () => {
    expect(canLockPickupEbol(input)).toBe(true)
    expect(canLockDeliveryEbol(input)).toBe(true)
    expect(canLockPickupEbol({ ...input, hasDamage: true, contactComment: 'I disagree' })).toBe(false)
    expect(canLockDeliveryEbol({ ...input, hasDamage: true, driverComment: 'See comments' })).toBe(false)
  })

  it('requires verified OTP and a separate exception note for damage', () => {
    const otp = { ...input, contactMethod: 'otp' as const, otpPhoneLast4: '0198' }
    expect(canLockPickupEbol(otp)).toBe(false)
    expect(canLockDeliveryEbol({ ...otp, otpVerified: true, hasDamage: true })).toBe(false)
    expect(canLockDeliveryEbol({ ...otp, otpVerified: true, hasDamage: true, exceptionNote: 'Recipient disputes packaging condition' })).toBe(true)
    expect(canLockPickupEbol({ ...otp, otpVerified: true })).toBe(true)
  })

  it('updates only unsigned target comments and restores them from storage', () => {
    const original = createOrderEbol(record)
    const draft = updateHandoffComments(original, 'pickup', comments)
    expect(original.pickup.comments).toBeUndefined()
    expect(draft.delivery).toEqual(original.delivery)
    let value = ''
    const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next } }
    expect(writeOrderEbols([draft], storage)).toBe(true)
    expect(readOrderEbols(storage)[0].pickup.comments).toEqual(comments)
  })

  it('preserves review comments when Pickup evidence is refreshed', () => {
    const draft = updateHandoffComments(createOrderEbol(record), 'pickup', comments)
    const refreshed = syncPickupOrderEbolDraft(draft, { ...record, photoCount: 4 })
    expect(refreshed.pickup.comments).toEqual(comments)
    expect(refreshed.pickup.evidence?.photoCount).toBe(4)
  })

  it('locks exactly the reviewed comments, trimming whitespace and retaining exceptions', () => {
    const draft = updateHandoffComments(createOrderEbol(record), 'pickup', comments)
    const locked = lockPickupEbol(draft, { ...input, contactComment: ' New comment ', driverComment: '', hasDamage: true, exceptionNote: ' Visible scratch ' })
    expect(locked.pickup.comments).toEqual({ contact: 'New comment', driver: '' })
    expect(locked.pickup.evidence).toMatchObject({ hasDamage: true, exceptionNote: 'Visible scratch' })
    expect(draft.pickup.comments).toEqual(comments)
  })

  it('does not allow comments or repeated signing to change locked original', () => {
    const locked = pickup()
    expect(updateHandoffComments(locked, 'pickup', { contact: 'Replace', driver: '' })).toBe(locked)
    expect(syncPickupOrderEbolDraft(locked, record)).toBe(locked)
    expect(() => lockPickupEbol(locked, input)).toThrow('already locked')
    expect(updateHandoffComments(locked, 99, comments)).toBe(locked)
    expect(updateHandoffComments(locked, 'delivery', comments)).toBe(locked)
  })

  it('keeps Supplemental comments separate through evidence refresh and signing', () => {
    const original = pickup()
    const draft = prepareSupplementalPickup(original, supplementInput)
    const reviewed = updateHandoffComments(draft, 2, { contact: 'One added chair', driver: 'Added at pickup' })
    const refreshed = prepareSupplementalPickup(reviewed, { ...supplementInput, photoCount: 2 })
    expect(refreshed.pickupSupplements[0].comments).toEqual(reviewed.pickupSupplements[0].comments)
    const locked = lockSupplementalPickup(refreshed, 2, input)
    expect(locked.pickup).toEqual(original.pickup)
    expect(locked.pickupSupplements[0].comments?.contact).toBe('One added chair')
    expect(updateHandoffComments(locked, 2, comments)).toBe(locked)
    expect(() => lockSupplementalPickup(locked, 2, input)).toThrow('draft is missing')
  })

  it('keeps Delivery comments on refresh and completion without changing Pickup', () => {
    const original = pickup()
    const draft = prepareDeliveryEbol(original, record, deliveryInput)
    const reviewed = updateHandoffComments(draft, 'delivery', { contact: 'Received at side entrance', driver: 'Delivered upstairs' })
    const refreshed = prepareDeliveryEbol(reviewed, record, { ...deliveryInput, photoCount: 3 })
    const complete = lockDeliveryEbol(refreshed, input)
    expect(complete.delivery.comments).toEqual(reviewed.delivery.comments)
    expect(complete.pickup).toEqual(original.pickup)
    expect(updateHandoffComments(complete, 'delivery', comments)).toBe(complete)
    expect(() => lockDeliveryEbol(complete, input)).toThrow('already locked')
  })

  it('lists signed versions in order, with exact snapshot scope and stable document numbers', () => {
    const original = pickup()
    const draft = prepareSupplementalPickup(original, supplementInput)
    expect(orderDocumentVersions(draft).map((item) => item.key)).toEqual(['pickup-1'])
    const supplemental = lockSupplementalPickup(draft, 2, input)
    const deliveryRecord = { ...record, totalWeight: record.totalWeight + 18,
      placeIds: [...original.pickup.evidence!.placeIds, 'ZB-EXTRA-01'],
      dimensionGroups: [...record.dimensionGroups, { id: 'extra', quantity: 1, length: 12, width: 12, height: 36, weight: 18 }] }
    const complete = lockDeliveryEbol(prepareDeliveryEbol(supplemental, deliveryRecord, deliveryInput), input)
    const versions = orderDocumentVersions(complete)
    expect(versions.map((item) => item.key)).toEqual(['pickup-1', 'pickup-2', 'delivery'])
    expect(versions[0].documentNumber).toBe(`${record.orderNumber}-PU-1`)
    expect(versions[1].documentNumber).toBe(`${record.orderNumber}-PU-2`)
    expect(versions[1].snapshot.evidence?.placeIds).toEqual(['ZB-EXTRA-01'])
    expect(versions[0].snapshot).toEqual(original.pickup)
    expect(orderDocumentVersions(complete)).toEqual(versions)
  })

  it('reads legacy locked documents without comments or a supplements array', () => {
    const legacy = JSON.parse(JSON.stringify(pickup()))
    delete legacy.pickup.comments
    delete legacy.pickupSupplements
    expect(orderDocumentVersions(legacy)).toHaveLength(1)
    expect(orderDocumentVersions(legacy)[0].snapshot.comments).toBeUndefined()
  })
})
