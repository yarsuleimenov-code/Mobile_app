import { findOrderEbol, readOrderEbols } from './orderEbolStore'
import type { EvidencePhoto } from './photoEvidenceDomain'

const packingPhotosKey = (order: string) => `zaberman-packing-photos:v1:${order}`
export const packingPhotoLimit = 100

export function canAddPackingPhotos(order: string) {
  return Boolean(findOrderEbol(readOrderEbols(), order)?.pickup.lockedAt)
}

export function readPackingPhotos(order: string): EvidencePhoto[] {
  try {
    const photos: unknown = JSON.parse(localStorage.getItem(packingPhotosKey(order)) ?? '[]')
    return Array.isArray(photos) ? photos.filter((photo) => photo?.orderNumber === order && photo.category === 'packaging') : []
  } catch { return [] }
}

export async function addPackingPhoto(order: string, source: 'camera' | 'gallery') {
  const key = packingPhotosKey(order)
  const add = () => {
    if (!canAddPackingPhotos(order)) throw new Error('Confirm Pickup before adding packing photos.')
    const photos = readPackingPhotos(order)
    if (photos.length >= packingPhotoLimit) throw new Error('Maximum 100 packing photos per order.')
    const photo: EvidencePhoto = {
      id: crypto.randomUUID(), orderNumber: order, handoff: 'pickup', category: 'packaging', source, asset: photos.length % 4,
    }
    const updated = [...photos, photo]
    localStorage.setItem(key, JSON.stringify(updated))
    return updated
  }
  return navigator.locks ? navigator.locks.request(key, add) : add()
}
