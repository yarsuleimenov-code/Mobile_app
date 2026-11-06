import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CARGO_RECORDS_STORAGE_KEY, initialCargoRecords, normalizeOrderNumber, type CargoRecord } from './cargoDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'
import { mockTodaySpokeRoute, type SpokeRoute } from './spokeDomain'
import { readSpokeRoute, routeForVehicleCycle, SPOKE_ROUTE_STORAGE_KEY } from './spokeRouteStore'
import { readStopProgressSnapshot, routeHasWork, stopProgressKey, withRouteStopLock } from './routeStopProgress'
import { readVehicleInspection, usePreTripInspection } from './preTripInspectionStore'
import { useEvidenceSync } from './useEvidenceSync'
import { editOrderDetails, initialOrderDetails, ORDER_DETAILS_STORAGE_KEY, readOrderDetails, type OrderDetails, type OrderDetailsEdit } from './orderDetailsDomain'
import { findPickupDemoRecord } from './pickupDemoData'
import { findPickupDraft, readPickupDrafts } from './pickupDraftStore'
import { pickupDraftToRecord } from './pickupDraftDomain'
import { findOrderEbol, readOrderEbols } from './orderEbolStore'

export type CargoSyncStatus = 'synced' | 'offline' | 'pending' | 'syncing' | 'retry' | 'conflict' | 'rejected'

interface CargoContextValue extends ReturnType<typeof useEvidenceSync> {
  records: CargoRecord[]
  getOrderDetails: (order: string) => OrderDetails
  saveOrderDetails: (order: string, edit: OrderDetailsEdit) => void
  getOrderCargo: (order: string) => CargoRecord | undefined
  spokeRoute?: SpokeRoute
  isSpokeRouteLoading: boolean
  syncStatus: CargoSyncStatus
  pendingChanges: number
  findRecord: (orderNumber: string) => CargoRecord | undefined
  loadTodaySpokeRoute: () => Promise<void>
  clearSpokeRoute: () => Promise<boolean>
  forceSync: () => Promise<void>
  savePickup: (record: CargoRecord) => void
  completeDropoff: (orderNumber: string) => void
}

const STORAGE_KEY = CARGO_RECORDS_STORAGE_KEY
const PENDING_SYNC_STORAGE_KEY = 'zaberman-pending-sync:v1'
const CargoContext = createContext<CargoContextValue | null>(null)

function readRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as CargoRecord[] : initialCargoRecords
  } catch {
    return initialCargoRecords
  }
}

function readPendingChanges() {
  try {
    const stored = Number(localStorage.getItem(PENDING_SYNC_STORAGE_KEY) ?? 0)
    return Number.isFinite(stored) && stored > 0 ? stored : 0
  } catch {
    return 0
  }
}

export function CargoProvider({ children }: { children: ReactNode }) {
  const { network, syncOutcome, role } = usePrototypeScenario()
  const { inspection, postTrip, history } = usePreTripInspection()
  const evidenceSync = useEvidenceSync(network, syncOutcome)
  const { evidenceQueue, syncEvidence } = evidenceSync
  const [orderDetails, setOrderDetails] = useState(readOrderDetails)
  const [records, setRecords] = useState<CargoRecord[]>(readRecords)
  const [storedRoute, setSpokeRoute] = useState<SpokeRoute | undefined>(() => {
    const stored = readSpokeRoute()
    if (stored || history.length || postTrip.completedAt) return stored
    // Older builds could start a fixture stop directly from Tasks.
    return routeHasWork(readStopProgressSnapshot(stopProgressKey(mockTodaySpokeRoute))) ? mockTodaySpokeRoute : undefined
  })
  const spokeRoute = routeForVehicleCycle(storedRoute, inspection.completedAt)
  const [isSpokeRouteLoading, setIsSpokeRouteLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(readPendingChanges)
  const networkRef = useRef(network)
  const syncBusy = useRef(false)
  const isOffline = useCallback(() => networkRef.current === 'offline' || !navigator.onLine, [])
  const [syncStatus, setSyncStatus] = useState<CargoSyncStatus>(() => (
    network !== 'offline' && navigator.onLine ? (pendingChanges ? 'pending' : 'synced') : 'offline'
  ))

  useEffect(() => {
    networkRef.current = network
  }, [network])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  useEffect(() => {
    if (storedRoute && !readSpokeRoute()) {
      try { localStorage.setItem(SPOKE_ROUTE_STORAGE_KEY, JSON.stringify(storedRoute)) }
      catch { /* Route mutations check that the assignment was saved. */ }
    }
  }, [storedRoute])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SPOKE_ROUTE_STORAGE_KEY) setSpokeRoute(readSpokeRoute())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (pendingChanges) localStorage.setItem(PENDING_SYNC_STORAGE_KEY, String(pendingChanges))
    else localStorage.removeItem(PENDING_SYNC_STORAGE_KEY)
  }, [pendingChanges])

  useEffect(() => {
    const handleOffline = () => setSyncStatus('offline')
    const handleOnline = () => {
      if (network === 'offline') {
        setSyncStatus('offline')
        return
      }
      setSyncStatus((current) => current === 'offline' ? (pendingChanges ? 'pending' : 'synced') : current)
    }
    if (network === 'offline' || !navigator.onLine) handleOffline()
    else handleOnline()
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [network, pendingChanges])

  const queueChange = useCallback(() => {
    setPendingChanges((current) => current + 1)
    setSyncStatus(network !== 'offline' && navigator.onLine ? 'pending' : 'offline')
  }, [network])

  const value = useMemo<CargoContextValue>(() => ({
    ...evidenceSync,
    records, spokeRoute, isSpokeRouteLoading,
    getOrderDetails: (value) => {
      const order = normalizeOrderNumber(value)
      return orderDetails[order] ?? initialOrderDetails(order, records.find((item) => item.orderNumber === order)?.title ?? '')
    },
    saveOrderDetails: (value, edit) => {
      const order = normalizeOrderNumber(value)
      const current = orderDetails[order] ?? initialOrderDetails(order, records.find((item) => item.orderNumber === order)?.title ?? '')
      const next = { ...orderDetails, [order]: editOrderDetails(current, edit, role) }
      // Persist first: a failed save must not masquerade as a saved rename.
      localStorage.setItem(ORDER_DETAILS_STORAGE_KEY, JSON.stringify(next))
      setOrderDetails(next)
    },
    getOrderCargo: (value) => {
      const order = normalizeOrderNumber(value)
      const record = records.find((item) => item.orderNumber === order) ?? findPickupDemoRecord(order)
      const locked = Boolean(findOrderEbol(readOrderEbols(), order)?.pickup.lockedAt)
      const draft = findPickupDraft(readPickupDrafts(), order, locked ? 'supplemental' : 'standard')
      return draft ? pickupDraftToRecord(draft, record) : record
    },
    syncStatus: syncStatus === 'offline' || syncStatus === 'syncing' ? syncStatus
      : evidenceQueue.some((item) => item.status === 'syncing') ? 'syncing'
      : evidenceQueue.some((item) => item.status === 'conflict') ? 'conflict'
      : evidenceQueue.some((item) => item.status === 'rejected') ? 'rejected'
      : evidenceQueue.some((item) => item.status === 'retry') ? 'retry'
      : evidenceQueue.some((item) => item.status === 'pending') || (syncStatus === 'synced' && pendingChanges > 0) ? 'pending' : syncStatus,
    pendingChanges: pendingChanges + evidenceQueue.filter((item) => item.status !== 'synced').length,
    findRecord: (value) => records.find((record) => record.orderNumber === normalizeOrderNumber(value)),
    loadTodaySpokeRoute: async () => {
      setIsSpokeRouteLoading(true)
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 650))
        const cycle = readVehicleInspection()
        const runId = cycle.inspection.completedAt
        if (!runId || cycle.postTrip.startedAt || cycle.postTrip.completedAt || routeForVehicleCycle(readSpokeRoute(), runId)) return
        const route = { ...mockTodaySpokeRoute, runId, syncedAt: new Date().toISOString() }
        localStorage.setItem(SPOKE_ROUTE_STORAGE_KEY, JSON.stringify(route))
        setSpokeRoute(route)
      } finally { setIsSpokeRouteLoading(false) }
    },
    clearSpokeRoute: async () => {
      if (!spokeRoute) return true
      let cleared = false
      await withRouteStopLock(spokeRoute, () => {
        const current = readSpokeRoute()
        if (!current || stopProgressKey(current) !== stopProgressKey(spokeRoute)) return
        if (routeHasWork(localStorage.getItem(stopProgressKey(current)) ?? '') && !readVehicleInspection().postTrip.completedAt) return
        localStorage.removeItem(SPOKE_ROUTE_STORAGE_KEY)
        setSpokeRoute(undefined)
        cleared = true
      })
      return cleared
    },
    forceSync: async () => {
      if (syncBusy.current) return
      if (isOffline()) {
        setSyncStatus('offline')
        return
      }
      syncBusy.current = true
      setSyncStatus('syncing')
      try {
        await Promise.all([syncEvidence(), pendingChanges > 0 && new Promise((resolve) => window.setTimeout(resolve, network === 'slow' ? 1800 : 700))])
        if (isOffline()) {
          setSyncStatus('offline')
          return
        }
        if (syncOutcome === 'success' || syncOutcome === 'partial') {
          setPendingChanges((current) => Math.max(0, current - pendingChanges))
          setSyncStatus('synced')
          return
        }
        setSyncStatus(pendingChanges ? syncOutcome : 'synced')
      } finally {
        syncBusy.current = false
      }
    },
    savePickup: (record) => {
      setRecords((current) => [record, ...current.filter((item) => item.orderNumber !== record.orderNumber)])
      queueChange()
    },
    completeDropoff: (value) => {
      setRecords((current) => current.map((record) => (
        record.orderNumber === normalizeOrderNumber(value) ? { ...record, status: 'dropoff_complete' } : record
      )))
    },
  }), [orderDetails, role, records, spokeRoute, isSpokeRouteLoading, syncStatus, pendingChanges, network, syncOutcome, queueChange, isOffline, evidenceSync, evidenceQueue, syncEvidence])

  return <CargoContext.Provider value={value}>{children}</CargoContext.Provider>
}

export function useCargo() {
  const value = useContext(CargoContext)
  if (!value) throw new Error('useCargo must be used inside CargoProvider')
  return value
}
