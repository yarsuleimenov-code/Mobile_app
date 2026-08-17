import type { CargoPlace, SyncItem, Task } from './domain'

export const tasks: Task[] = [
  { id: 'PU-101', orderId: '12345678', type: 'pickup', movementType: 'local_same_day', time: '9:30 AM', address: '100 Market St', city: 'Newark, NJ 07102', status: 'in_progress', routeRunId: 'SD-2408' },
  { id: 'DO-102', orderId: '12345679', type: 'dropoff', movementType: 'local_standard', time: '10:45 AM', address: '50 Park Ave', city: 'Edison, NJ 08837', status: 'ready' },
  { id: 'PU-103', orderId: '12345680', type: 'pickup', movementType: 'local_standard', time: '1:15 PM', address: '422 Broad St', city: 'Elizabeth, NJ 07201', status: 'ready' },
  { id: 'DO-104', orderId: '12345681', type: 'dropoff', movementType: 'local_same_day', time: '2:30 PM', address: '300 Secaucus Rd', city: 'Secaucus, NJ 07094', status: 'ready', routeRunId: 'SD-2408' },
]

export const initialPlaces: CargoPlace[] = [
  { id: 'ZB-8F2A-01', label: 'Place 1', dimensions: '24×16×12 in', weight: 18, items: 1, complete: true },
  { id: 'ZB-8F2A-02', label: 'Place 2', dimensions: '36×20×20 in', weight: 32, items: 2, complete: false },
  { id: 'ZB-8F2A-03', label: 'Place 3', dimensions: '48×24×24 in', weight: 45, items: 3, complete: true },
]

export const dropoffPlaces: CargoPlace[] = [
  { id: 'ZB-3C19-01', label: 'Place 1', dimensions: '30×18×14 in', weight: 21, items: 1, complete: true },
  { id: 'ZB-3C19-02', label: 'Place 2', dimensions: '42×22×18 in', weight: 38, items: 1, complete: true },
  { id: 'ZB-3C19-03', label: 'Place 3', dimensions: '28×18×18 in', weight: 16, items: 2, complete: true },
]

export const initialSyncItems: SyncItem[] = [
  { id: 'SYNC-1', title: 'Pickup #12345678', meta: '3 place updates · saved 2 min ago', status: 'pending' },
  { id: 'SYNC-2', title: 'Damage photos #12345680', meta: '2 photos · retry scheduled', status: 'retry' },
]

export const roleLabels = {
  warehouse: 'Warehouse employee',
  driver: 'Driver',
  delivery: 'Delivery crew',
  supervisor: 'Supervisor',
  dispatcher: 'Dispatcher',
  admin: 'Administrator',
} as const
