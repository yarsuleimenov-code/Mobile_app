import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Warehouse } from './cargoDomain'
import { createInterstateDirection, type GeneratedInterstateTrip, type InterstateDirection, type InterstatePlace } from './interstateDomain'

interface InterstateContextValue {
  direction: InterstateDirection
  originWarehouse: Warehouse
  destinationWarehouse: Warehouse
  truck: string
  loadedPlaceKeys: string[]
  generatedTrip?: GeneratedInterstateTrip
  setOriginWarehouse: (warehouse: Warehouse) => void
  setDestinationWarehouse: (warehouse: Warehouse) => void
  setTruck: (truck: string) => void
  togglePlace: (key: string) => void
  loadAll: (places: InterstatePlace[]) => void
  clearLoading: () => void
  createTrip: (trip: GeneratedInterstateTrip) => void
}

const InterstateContext = createContext<InterstateContextValue | null>(null)

export function InterstateProvider({ children }: { children: ReactNode }) {
  const [originWarehouse, setOriginWarehouseState] = useState<Warehouse>('NJ1')
  const [destinationWarehouse, setDestinationWarehouseState] = useState<Warehouse>('CA1')
  const [truck, setTruck] = useState('Truck 1 · 26 ft')
  const [loadedPlaceKeys, setLoadedPlaceKeys] = useState<string[]>([])
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedInterstateTrip>()

  const direction = createInterstateDirection(originWarehouse, destinationWarehouse)
  const resetLoading = () => { setLoadedPlaceKeys([]); setGeneratedTrip(undefined) }

  const value = useMemo<InterstateContextValue>(() => ({
    direction, originWarehouse, destinationWarehouse, truck, loadedPlaceKeys, generatedTrip,
    setOriginWarehouse: (next) => { if (next !== destinationWarehouse) { setOriginWarehouseState(next); resetLoading() } },
    setDestinationWarehouse: (next) => { if (next !== originWarehouse) { setDestinationWarehouseState(next); resetLoading() } },
    setTruck,
    togglePlace: (key) => setLoadedPlaceKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]),
    loadAll: (places) => setLoadedPlaceKeys((current) => Array.from(new Set([...current, ...places.map((place) => place.key)]))),
    clearLoading: () => { setLoadedPlaceKeys([]); setGeneratedTrip(undefined) },
    createTrip: setGeneratedTrip,
  }), [direction, originWarehouse, destinationWarehouse, truck, loadedPlaceKeys, generatedTrip])

  return <InterstateContext.Provider value={value}>{children}</InterstateContext.Provider>
}

export function useInterstate() {
  const value = useContext(InterstateContext)
  if (!value) throw new Error('useInterstate must be used inside InterstateProvider')
  return value
}
