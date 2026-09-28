import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  emptyPreTripInspection,
  inspectionCanComplete,
  type PreTripAnswer,
  type PreTripCheckId,
  type PreTripInspectionState,
  type PreTripPhotoId,
} from './preTripInspectionDomain'

interface PreTripInspectionContextValue {
  inspection: PreTripInspectionState
  answerCheck: (id: PreTripCheckId, answer: PreTripAnswer) => void
  capturePhoto: (id: PreTripPhotoId) => void
  setAttested: (attested: boolean) => void
  completeInspection: () => boolean
  resetInspection: () => void
}

const STORAGE_KEY = 'zaberman-pre-trip-inspection:v1'
const PreTripInspectionContext = createContext<PreTripInspectionContextValue | null>(null)

function readInspection(): PreTripInspectionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyPreTripInspection
    const parsed = JSON.parse(raw) as Partial<PreTripInspectionState>
    return {
      answers: parsed.answers ?? {},
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
      attested: Boolean(parsed.attested),
      completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
    }
  } catch {
    return emptyPreTripInspection
  }
}

export function PreTripInspectionProvider({ children }: { children: ReactNode }) {
  const [inspection, setInspection] = useState<PreTripInspectionState>(readInspection)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inspection))
  }, [inspection])

  const value = useMemo<PreTripInspectionContextValue>(() => ({
    inspection,
    answerCheck: (id, answer) => setInspection((current) => ({
      ...current,
      answers: { ...current.answers, [id]: answer },
      completedAt: null,
    })),
    capturePhoto: (id) => setInspection((current) => ({
      ...current,
      photos: current.photos.includes(id) ? current.photos : [...current.photos, id],
      completedAt: null,
    })),
    setAttested: (attested) => setInspection((current) => ({ ...current, attested, completedAt: null })),
    completeInspection: () => {
      if (!inspectionCanComplete(inspection)) return false
      setInspection((current) => ({ ...current, completedAt: new Date().toISOString() }))
      return true
    },
    resetInspection: () => setInspection(emptyPreTripInspection),
  }), [inspection])

  return <PreTripInspectionContext.Provider value={value}>{children}</PreTripInspectionContext.Provider>
}

export function usePreTripInspection() {
  const value = useContext(PreTripInspectionContext)
  if (!value) throw new Error('usePreTripInspection must be used inside PreTripInspectionProvider')
  return value
}
