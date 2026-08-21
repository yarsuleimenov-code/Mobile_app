import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialCargoRecords, normalizeOrderNumber, type CargoRecord } from './cargoDomain'
import { mockTodaySpokeRoute, type SpokeRoute } from './spokeDomain'

interface CargoContextValue {
  records: CargoRecord[]
  spokeRoute?: SpokeRoute
  isSpokeRouteLoading: boolean
  findRecord: (orderNumber: string) => CargoRecord | undefined
  loadTodaySpokeRoute: () => Promise<void>
  savePickup: (record: CargoRecord) => void
  completeDropoff: (orderNumber: string) => void
}

const STORAGE_KEY = 'zaberman-cargo-records:v4'
const SPOKE_ROUTE_STORAGE_KEY = 'zaberman-spoke-route:v1'
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

export function CargoProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<CargoRecord[]>(readRecords)
  const [spokeRoute, setSpokeRoute] = useState<SpokeRoute | undefined>(readSpokeRoute)
  const [isSpokeRouteLoading, setIsSpokeRouteLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  useEffect(() => {
    if (spokeRoute) localStorage.setItem(SPOKE_ROUTE_STORAGE_KEY, JSON.stringify(spokeRoute))
  }, [spokeRoute])

  const value = useMemo<CargoContextValue>(() => ({
    records, spokeRoute, isSpokeRouteLoading,
    findRecord: (value) => records.find((record) => record.orderNumber === normalizeOrderNumber(value)),
    loadTodaySpokeRoute: async () => {
      setIsSpokeRouteLoading(true)
      await new Promise((resolve) => window.setTimeout(resolve, 650))
      setSpokeRoute({ ...mockTodaySpokeRoute, syncedAt: new Date().toISOString() })
      setIsSpokeRouteLoading(false)
    },
    savePickup: (record) => setRecords((current) => [record, ...current.filter((item) => item.orderNumber !== record.orderNumber)]),
    completeDropoff: (value) => setRecords((current) => current.map((record) => (
      record.orderNumber === normalizeOrderNumber(value) ? { ...record, status: 'dropoff_complete' } : record
    ))),
  }), [records, spokeRoute, isSpokeRouteLoading])

  return <CargoContext.Provider value={value}>{children}</CargoContext.Provider>
}

export function useCargo() {
  const value = useContext(CargoContext)
  if (!value) throw new Error('useCargo must be used inside CargoProvider')
  return value
}
