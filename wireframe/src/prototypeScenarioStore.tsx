import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { NetworkMode, Role } from './domain'

export type PrototypeBranch = 'NJ1' | 'CA1' | 'CA2'
export type SyncOutcome = 'success' | 'retry' | 'conflict' | 'rejected'
export type SmsOutcome = 'success' | 'error'
export type DeviceKind = 'camera' | 'scanner' | 'printer'

interface PrototypeScenario {
  branch: PrototypeBranch
  role: Role
  network: Exclude<NetworkMode, 'error'>
  syncOutcome: SyncOutcome
  printOutcome: 'success' | 'error'
  emailOutcome: 'success' | 'error'
  smsOutcome: SmsOutcome
  devices: Record<DeviceKind, boolean>
}

interface PrototypeScenarioContextValue extends PrototypeScenario {
  setBranch: (branch: PrototypeBranch) => void
  setRole: (role: Role) => void
  setNetwork: (network: PrototypeScenario['network']) => void
  setSyncOutcome: (outcome: SyncOutcome) => void
  setPrintOutcome: (outcome: PrototypeScenario['printOutcome']) => void
  setEmailOutcome: (outcome: PrototypeScenario['emailOutcome']) => void
  setSmsOutcome: (outcome: SmsOutcome) => void
  setDeviceAvailable: (device: DeviceKind, available: boolean) => void
  resetMockData: () => void
}

const STORAGE_KEY = 'zaberman-prototype-scenarios:v1'
const initialScenario: PrototypeScenario = {
  branch: 'NJ1',
  role: 'delivery',
  network: 'online',
  syncOutcome: 'success',
  printOutcome: 'success',
  emailOutcome: 'success',
  smsOutcome: 'success',
  devices: { camera: true, scanner: true, printer: true },
}

const PrototypeScenarioContext = createContext<PrototypeScenarioContextValue | null>(null)

function readScenario(): PrototypeScenario {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialScenario
    const parsed = JSON.parse(stored) as Partial<PrototypeScenario>
    return {
      ...initialScenario,
      ...parsed,
      devices: { ...initialScenario.devices, ...parsed.devices },
    }
  } catch {
    return initialScenario
  }
}

export function PrototypeScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<PrototypeScenario>(readScenario)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario))
  }, [scenario])

  const value = useMemo<PrototypeScenarioContextValue>(() => ({
    ...scenario,
    setBranch: (branch) => setScenario((current) => ({ ...current, branch })),
    setRole: (role) => setScenario((current) => ({ ...current, role })),
    setNetwork: (network) => setScenario((current) => ({ ...current, network })),
    setSyncOutcome: (syncOutcome) => setScenario((current) => ({ ...current, syncOutcome })),
    setPrintOutcome: (printOutcome) => setScenario((current) => ({ ...current, printOutcome })),
    setEmailOutcome: (emailOutcome) => setScenario((current) => ({ ...current, emailOutcome })),
    setSmsOutcome: (smsOutcome) => setScenario((current) => ({ ...current, smsOutcome })),
    setDeviceAvailable: (device, available) => setScenario((current) => ({
      ...current,
      devices: { ...current.devices, [device]: available },
    })),
    resetMockData: () => {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('zaberman-'))
        .forEach((key) => localStorage.removeItem(key))
      window.location.reload()
    },
  }), [scenario])

  return <PrototypeScenarioContext.Provider value={value}>{children}</PrototypeScenarioContext.Provider>
}

export function usePrototypeScenario() {
  const value = useContext(PrototypeScenarioContext)
  if (!value) throw new Error('usePrototypeScenario must be used inside PrototypeScenarioProvider')
  return value
}
