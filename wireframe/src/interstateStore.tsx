import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Warehouse } from './cargoDomain'
import { createInterstateDirection, type GeneratedInterstateTrip, type InterstateDirection, type InterstatePlace } from './interstateDomain'

interface InterstateContextValue {
  direction: InterstateDirection
  originWarehouse: Warehouse
  destinationWarehouse: Warehouse
  truck: string
  loadedPlaceKeys: string[]
  generatedTrip?: GeneratedInterstateTrip
  unloadingDrafts: Record<string, string[]>
  completedUnloadingTripIds: string[]
  setOriginWarehouse: (warehouse: Warehouse) => void
  setDestinationWarehouse: (warehouse: Warehouse) => void
  setTruck: (truck: string) => void
  togglePlace: (key: string) => void
  loadAll: (places: InterstatePlace[]) => void
  clearLoading: () => void
  createTrip: (trip: GeneratedInterstateTrip) => void
  receivePlace: (tripId: string, placeKey: string) => void
  toggleReceivedPlace: (tripId: string, placeKey: string) => void
  completeUnloading: (tripId: string) => void
}

const UNLOADING_DRAFTS_STORAGE_KEY = 'zaberman-unloading-drafts:v1'
const COMPLETED_UNLOADING_STORAGE_KEY = 'zaberman-completed-unloading:v1'
const InterstateContext = createContext<InterstateContextValue | null>(null)

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) as T : fallback
  } catch {
    return fallback
  }
}

export function InterstateProvider({ children }: { children: ReactNode }) {
  const [originWarehouse, setOriginWarehouseState] = useState<Warehouse>('NJ1')
  const [destinationWarehouse, setDestinationWarehouseState] = useState<Warehouse>('CA1')
  const [truck, setTruck] = useState('Truck 1 · 26 ft')
  const [loadedPlaceKeys, setLoadedPlaceKeys] = useState<string[]>([])
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedInterstateTrip>()
  const [unloadingDrafts, setUnloadingDrafts] = useState<Record<string, string[]>>(() => readStored(UNLOADING_DRAFTS_STORAGE_KEY, {}))
  const [completedUnloadingTripIds, setCompletedUnloadingTripIds] = useState<string[]>(() => readStored(COMPLETED_UNLOADING_STORAGE_KEY, []))

  const direction = createInterstateDirection(originWarehouse, destinationWarehouse)
  const resetLoading = () => { setLoadedPlaceKeys([]); setGeneratedTrip(undefined) }

  useEffect(() => {
    localStorage.setItem(UNLOADING_DRAFTS_STORAGE_KEY, JSON.stringify(unloadingDrafts))
  }, [unloadingDrafts])

  useEffect(() => {
    localStorage.setItem(COMPLETED_UNLOADING_STORAGE_KEY, JSON.stringify(completedUnloadingTripIds))
  }, [completedUnloadingTripIds])

  const value = useMemo<InterstateContextValue>(() => ({
    direction, originWarehouse, destinationWarehouse, truck, loadedPlaceKeys, generatedTrip, unloadingDrafts, completedUnloadingTripIds,
    setOriginWarehouse: (next) => { if (next !== destinationWarehouse) { setOriginWarehouseState(next); resetLoading() } },
    setDestinationWarehouse: (next) => { if (next !== originWarehouse) { setDestinationWarehouseState(next); resetLoading() } },
    setTruck,
    togglePlace: (key) => setLoadedPlaceKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]),
    loadAll: (places) => setLoadedPlaceKeys((current) => Array.from(new Set([...current, ...places.map((place) => place.key)]))),
    clearLoading: () => { setLoadedPlaceKeys([]); setGeneratedTrip(undefined) },
    createTrip: setGeneratedTrip,
    receivePlace: (tripId, placeKey) => setUnloadingDrafts((current) => ({
      ...current,
      [tripId]: current[tripId]?.includes(placeKey) ? current[tripId] : [...(current[tripId] ?? []), placeKey],
    })),
    toggleReceivedPlace: (tripId, placeKey) => setUnloadingDrafts((current) => ({
      ...current,
      [tripId]: current[tripId]?.includes(placeKey)
        ? current[tripId].filter((key) => key !== placeKey)
        : [...(current[tripId] ?? []), placeKey],
    })),
    completeUnloading: (tripId) => setCompletedUnloadingTripIds((current) => current.includes(tripId) ? current : [...current, tripId]),
  }), [direction, originWarehouse, destinationWarehouse, truck, loadedPlaceKeys, generatedTrip, unloadingDrafts, completedUnloadingTripIds])

  return <InterstateContext.Provider value={value}>{children}</InterstateContext.Provider>
}

export function useInterstate() {
  const value = useContext(InterstateContext)
  if (!value) throw new Error('useInterstate must be used inside InterstateProvider')
  return value
}
