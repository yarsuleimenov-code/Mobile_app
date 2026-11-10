export interface OrderReferencePhoto {
  src: string
  caption: string
}

interface OrderReferenceData {
  brokerComment?: string
  coi?: string
  photos?: OrderReferencePhoto[]
  addedPhotos?: OrderReferencePhoto[]
}

const chair: OrderReferencePhoto = {
  src: new URL('./assets/order-reference/dining-chair.jpg', import.meta.url).href,
  caption: 'Dining chair',
}
const table: OrderReferencePhoto = {
  src: new URL('./assets/order-reference/dining-table.jpg', import.meta.url).href,
  caption: 'Dining table',
}

// Local order-source snapshots. Reference photos are separate from handoff evidence.
const references: Record<string, OrderReferenceData> = {
  '23343775': {
    brokerComment: 'The seller provided a reference photo of the chair style.',
    photos: [chair],
  },
  '11098765': {
    brokerComment: 'The customer sent photos of the table and chairs for identification.',
    coi: 'Required for building access. Confirm it with the dispatcher before arrival.',
    photos: [table],
    addedPhotos: [chair],
  },
  '76000002': { photos: [table] },
  '76000003': { photos: [chair] },
  '76000004': { photos: [table] },
  '76000005': { photos: [table] },
  '76000006': { photos: [chair] },
}

export function orderReferenceKey(order: string) {
  return `zaberman-order-reference:v1:${order}`
}

export function hasRefreshedOrderReference(order: string) {
  try { return localStorage.getItem(orderReferenceKey(order)) === 'latest' }
  catch { return false }
}

export function getOrderReferenceData(order: string, refreshed = false) {
  const reference = references[order]
  const photos = reference?.photos ?? [table, chair]
  return {
    brokerComment: reference?.brokerComment,
    coi: reference?.coi,
    photos: refreshed && reference?.addedPhotos ? [...photos, ...reference.addedPhotos] : photos,
  }
}
