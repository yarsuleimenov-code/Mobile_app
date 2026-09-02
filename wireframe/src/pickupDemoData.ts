import { normalizeOrderNumber, type CargoRecord, type DimensionGroup } from './cargoDomain'
import { mockTodaySpokeRoute } from './spokeDomain'

const demoCargo: Record<string, { groups: DimensionGroup[]; packaging: string; responsible: string; comment: string }> = {
  '23343775': {
    groups: [{ id: 'chairs', quantity: 3, length: 24, width: 24, height: 36, weight: 18 }],
    packaging: 'Zaberman', responsible: 'John Doe',
    comment: '3 dining chairs. Blanket-wrap each chair; protect the legs. Ground-floor pickup in Belmont.',
  },
  '23343778': {
    groups: [
      { id: 'sofa', quantity: 1, length: 84, width: 36, height: 32, weight: 140 },
      { id: 'side-tables', quantity: 2, length: 24, width: 24, height: 24, weight: 25 },
    ],
    packaging: 'Mixed', responsible: 'Maria Lopez',
    comment: 'One sofa and two side tables. Two-person lift for the sofa; do not stack on upholstery.',
  },
  '23343780': {
    groups: [
      { id: 'chairs', quantity: 4, length: 24, width: 24, height: 36, weight: 20 },
      { id: 'ottoman', quantity: 1, length: 30, width: 24, height: 18, weight: 15 },
    ],
    packaging: 'Customer', responsible: 'Daniel Kim',
    comment: 'Four chairs and one ottoman, customer-packed. Check wrap and count all five pieces before signing.',
  },
  '23343782': {
    groups: [{ id: 'console', quantity: 1, length: 54, width: 18, height: 32, weight: 65 }],
    packaging: 'Zaberman', responsible: 'Maria Lopez',
    comment: 'Console table. Protect corners and glass top; transport upright. Call 30 minutes before arrival.',
  },
}

// Templates only: opening a planned stop must not mark its Pickup as recorded.
export function findPickupDemoRecord(orderNumber: string): CargoRecord | undefined {
  const order = normalizeOrderNumber(orderNumber)
  const cargo = demoCargo[order]
  const task = mockTodaySpokeRoute.tasks.find((item) => item.externalId === order && item.operation === 'pickup')
  if (!cargo || !task) return undefined
  return {
    orderNumber: order, title: task.title, pickupDate: mockTodaySpokeRoute.workDate,
    originBranch: 'NJ1', destinationBranch: 'CA1',
    totalWeight: cargo.groups.reduce((total, group) => total + group.quantity * (group.weight ?? 0), 0),
    dimensionGroups: cargo.groups.map((group) => ({ ...group })),
    packaging: cargo.packaging, responsible: cargo.responsible, orderComment: cargo.comment,
    photoCount: 3, status: 'pickup_recorded',
  }
}
