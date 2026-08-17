export type MovementType = 'local_standard' | 'local_same_day' | 'interstate' | 'interbranch_transfer'
export type OperationType = 'pickup' | 'dropoff'
export type Role = 'warehouse' | 'driver' | 'delivery' | 'supervisor' | 'dispatcher' | 'admin'
export type NetworkMode = 'online' | 'offline' | 'slow' | 'error'

export interface Task {
  id: string
  orderId: string
  type: OperationType
  movementType: MovementType
  time: string
  address: string
  city: string
  status: 'ready' | 'in_progress' | 'done' | 'attention'
  routeRunId?: string
}

export interface CargoPlace {
  id: string
  label: string
  dimensions: string
  weight: number | null
  items: number
  complete: boolean
  scanned?: boolean
  damaged?: boolean
}

export interface SyncItem {
  id: string
  title: string
  meta: string
  status: 'pending' | 'retry' | 'conflict'
}
