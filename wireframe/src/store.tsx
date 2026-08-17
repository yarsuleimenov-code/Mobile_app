import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialPlaces, initialSyncItems } from './data'
import type { CargoPlace, NetworkMode, Role, SyncItem } from './domain'

interface DemoState {
  branch: 'NJ1' | 'CA1' | 'CA2'
  role: Role
  network: NetworkMode
  places: CargoPlace[]
  pickupPhotos: number
  dropoffScanned: string[]
  syncItems: SyncItem[]
}

interface DemoContextValue extends DemoState {
  setBranch: (branch: DemoState['branch']) => void
  setRole: (role: Role) => void
  setNetwork: (mode: NetworkMode) => void
  togglePlace: (id: string) => void
  addPlace: () => void
  addPickupPhoto: () => void
  scanDropoff: (id: string) => void
  retrySync: (id: string) => void
  resetDemo: () => void
}

const STORAGE_KEY = 'zaberman-wireframe:v1'
const initialState: DemoState = {
  branch: 'NJ1',
  role: 'delivery',
  network: 'online',
  places: initialPlaces,
  pickupPhotos: 2,
  dropoffScanned: [],
  syncItems: initialSyncItems,
}

const DemoContext = createContext<DemoContextValue | null>(null)

function readStoredState(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...initialState, ...JSON.parse(stored) } : initialState
  } catch {
    return initialState
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(readStoredState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<DemoContextValue>(() => ({
    ...state,
    setBranch: (branch) => setState((current) => ({ ...current, branch })),
    setRole: (role) => setState((current) => ({ ...current, role })),
    setNetwork: (network) => setState((current) => ({ ...current, network })),
    togglePlace: (id) => setState((current) => ({
      ...current,
      places: current.places.map((place) => place.id === id ? { ...place, complete: !place.complete } : place),
    })),
    addPlace: () => setState((current) => ({
      ...current,
      places: [...current.places, {
        id: `ZB-8F2A-0${current.places.length + 1}`,
        label: `Place ${current.places.length + 1}`,
        dimensions: 'Dimensions needed',
        weight: null,
        items: 1,
        complete: false,
      }],
    })),
    addPickupPhoto: () => setState((current) => ({ ...current, pickupPhotos: current.pickupPhotos + 1 })),
    scanDropoff: (id) => setState((current) => ({
      ...current,
      dropoffScanned: current.dropoffScanned.includes(id) ? current.dropoffScanned : [...current.dropoffScanned, id],
    })),
    retrySync: (id) => setState((current) => ({
      ...current,
      syncItems: current.syncItems.filter((item) => item.id !== id),
    })),
    resetDemo: () => setState(initialState),
  }), [state])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const value = useContext(DemoContext)
  if (!value) throw new Error('useDemo must be used inside DemoProvider')
  return value
}
