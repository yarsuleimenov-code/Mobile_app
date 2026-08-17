import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { GeneratedInterstateTrip, InterstateDirection, InterstatePlace } from './interstateDomain'

interface InterstateContextValue {
  direction: InterstateDirection
  truck: string
  loadedPlaceKeys: string[]
  generatedTrip?: GeneratedInterstateTrip
  setDirection: (direction: InterstateDirection) => void
  setTruck: (truck: string) => void
  togglePlace: (key: string) => void
  loadAll: (places: InterstatePlace[]) => void
  clearLoading: () => void
  createTrip: (trip: GeneratedInterstateTrip) => void
}

const InterstateContext = createContext<InterstateContextValue | null>(null)

export function InterstateProvider({ children }: { children: ReactNode }) {
  const [direction, setDirectionState] = useState<InterstateDirection>('NJ1_CA1')
  const [truck, setTruck] = useState('Truck 1 · 26 ft')
  const [loadedPlaceKeys, setLoadedPlaceKeys] = useState<string[]>([])
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedInterstateTrip>()

  const value = useMemo<InterstateContextValue>(() => ({
    direction, truck, loadedPlaceKeys, generatedTrip,
    setDirection: (next) => { setDirectionState(next); setLoadedPlaceKeys([]); setGeneratedTrip(undefined) },
    setTruck,
    togglePlace: (key) => setLoadedPlaceKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]),
    loadAll: (places) => setLoadedPlaceKeys((current) => Array.from(new Set([...current, ...places.map((place) => place.key)]))),
    clearLoading: () => { setLoadedPlaceKeys([]); setGeneratedTrip(undefined) },
    createTrip: setGeneratedTrip,
  }), [direction, truck, loadedPlaceKeys, generatedTrip])

  return <InterstateContext.Provider value={value}>{children}</InterstateContext.Provider>
}

export function useInterstate() {
  const value = useContext(InterstateContext)
  if (!value) throw new Error('useInterstate must be used inside InterstateProvider')
  return value
}
