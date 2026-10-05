import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CARGO_RECORDS_STORAGE_KEY, initialCargoRecords, normalizeOrderNumber, type CargoRecord } from './cargoDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'
import { mockTodaySpokeRoute, refreshDemoRouteAddresses, type SpokeRoute } from './spokeDomain'
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
  clearSpokeRoute: () => void
  forceSync: () => Promise<void>
  savePickup: (record: CargoRecord) => void
  completeDropoff: (orderNumber: string) => void
}

const STORAGE_KEY = CARGO_RECORDS_STORAGE_KEY
const SPOKE_ROUTE_STORAGE_KEY = 'zaberman-spoke-route:v1'
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

function readSpokeRoute() {
  try {
    const stored = localStorage.getItem(SPOKE_ROUTE_STORAGE_KEY)
    return stored ? refreshDemoRouteAddresses(JSON.parse(stored) as SpokeRoute) : undefined
  } catch {
    return undefined
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
  const evidenceSync = useEvidenceSync(network, syncOutcome)
  const { evidenceQueue, syncEvidence } = evidenceSync
  const [orderDetails, setOrderDetails] = useState(readOrderDetails)
  const [records, setRecords] = useState<CargoRecord[]>(readRecords)
  const [spokeRoute, setSpokeRoute] = useState<SpokeRoute | undefined>(readSpokeRoute)
  const [isSpokeRouteLoading, setIsSpokeRouteLoading] = useState(false)
  const [pendingChanges, setPendingChanges] = useState(readPendingChanges)
  const networkRef = useRef(network)
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
    if (spokeRoute) localStorage.setItem(SPOKE_ROUTE_STORAGE_KEY, JSON.stringify(spokeRoute))
  }, [spokeRoute])

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
      : evidenceQueue.some((item) => item.status === 'pending') ? 'pending' : syncStatus,
    pendingChanges: pendingChanges + evidenceQueue.filter((item) => item.status !== 'synced').length,
    findRecord: (value) => records.find((record) => record.orderNumber === normalizeOrderNumber(value)),
    loadTodaySpokeRoute: async () => {
      setIsSpokeRouteLoading(true)
      await new Promise((resolve) => window.setTimeout(resolve, 650))
      setSpokeRoute({ ...mockTodaySpokeRoute, syncedAt: new Date().toISOString() })
      setIsSpokeRouteLoading(false)
    },
    clearSpokeRoute: () => {
      setSpokeRoute(undefined)
      setIsSpokeRouteLoading(false)
      localStorage.removeItem(SPOKE_ROUTE_STORAGE_KEY)
    },
    forceSync: async () => {
      if (isOffline()) {
        setSyncStatus('offline')
        return
      }
      setSyncStatus('syncing')
      await Promise.all([syncEvidence(), new Promise((resolve) => window.setTimeout(resolve, network === 'slow' ? 1800 : 700))])
      if (isOffline()) {
        setSyncStatus('offline')
        return
      }
      if (syncOutcome === 'success') {
        setPendingChanges(0)
        setSyncStatus('synced')
        return
      }
      // Evidence failures live in their own queue; do not invent a legacy pending item.
      setSyncStatus(pendingChanges ? syncOutcome : 'synced')
    },
    savePickup: (record) => {
      setRecords((current) => [record, ...current.filter((item) => item.orderNumber !== record.orderNumber)])
      queueChange()
    },
    completeDropoff: (value) => {
      setRecords((current) => current.map((record) => (
        record.orderNumber === normalizeOrderNumber(value) ? { ...record, status: 'dropoff_complete' } : record
      )))
      queueChange()
    },
  }), [orderDetails, role, records, spokeRoute, isSpokeRouteLoading, syncStatus, pendingChanges, network, syncOutcome, queueChange, isOffline, evidenceSync, evidenceQueue, syncEvidence])

  return <CargoContext.Provider value={value}>{children}</CargoContext.Provider>
}

export function useCargo() {
  const value = useContext(CargoContext)
  if (!value) throw new Error('useCargo must be used inside CargoProvider')
  return value
}
