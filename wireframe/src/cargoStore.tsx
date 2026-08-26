import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { initialCargoRecords, normalizeOrderNumber, type CargoRecord } from './cargoDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'
import { mockTodaySpokeRoute, type SpokeRoute } from './spokeDomain'

export type CargoSyncStatus = 'synced' | 'offline' | 'pending' | 'syncing' | 'retry' | 'conflict' | 'rejected'

interface CargoContextValue {
  records: CargoRecord[]
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

const STORAGE_KEY = 'zaberman-cargo-records:v4'
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
    return stored ? JSON.parse(stored) as SpokeRoute : undefined
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
  const { network, syncOutcome } = usePrototypeScenario()
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
    records, spokeRoute, isSpokeRouteLoading, syncStatus, pendingChanges,
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
      await new Promise((resolve) => window.setTimeout(resolve, network === 'slow' ? 1800 : 700))
      if (isOffline()) {
        setSyncStatus('offline')
        return
      }
      if (syncOutcome === 'success') {
        setPendingChanges(0)
        setSyncStatus('synced')
        return
      }
      setPendingChanges((current) => Math.max(current, 1))
      setSyncStatus(syncOutcome)
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
  }), [records, spokeRoute, isSpokeRouteLoading, syncStatus, pendingChanges, network, syncOutcome, queueChange, isOffline])

  return <CargoContext.Provider value={value}>{children}</CargoContext.Provider>
}

export function useCargo() {
  const value = useContext(CargoContext)
  if (!value) throw new Error('useCargo must be used inside CargoProvider')
  return value
}
