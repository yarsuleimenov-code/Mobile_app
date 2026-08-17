import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialCargoRecords, normalizeOrderNumber, type CargoRecord } from './cargoDomain'

interface CargoContextValue {
  records: CargoRecord[]
  findRecord: (orderNumber: string) => CargoRecord | undefined
  savePickup: (record: CargoRecord) => void
  completeDropoff: (orderNumber: string) => void
}

const STORAGE_KEY = 'zaberman-cargo-records:v4'
const CargoContext = createContext<CargoContextValue | null>(null)

function readRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as CargoRecord[] : initialCargoRecords
  } catch {
    return initialCargoRecords
  }
}

export function CargoProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<CargoRecord[]>(readRecords)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  const value = useMemo<CargoContextValue>(() => ({
    records,
    findRecord: (value) => records.find((record) => record.orderNumber === normalizeOrderNumber(value)),
    savePickup: (record) => setRecords((current) => [record, ...current.filter((item) => item.orderNumber !== record.orderNumber)]),
    completeDropoff: (value) => setRecords((current) => current.map((record) => (
      record.orderNumber === normalizeOrderNumber(value) ? { ...record, status: 'dropoff_complete' } : record
    ))),
  }), [records])

  return <CargoContext.Provider value={value}>{children}</CargoContext.Provider>
}

export function useCargo() {
  const value = useContext(CargoContext)
  if (!value) throw new Error('useCargo must be used inside CargoProvider')
  return value
}
