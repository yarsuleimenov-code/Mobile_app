import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  inspectionCanComplete,
  inspectionDriver,
  type PreTripInspectionState,
  type PreTripPhotoId,
} from './preTripInspectionDomain'
import { emptyVehicleInspection, finishPostTrip, restoreVehicleInspection, startNextVehicleCycle, type PostTripInspectionState, type VehicleInspectionState } from './postTripInspectionDomain'

interface PreTripInspectionContextValue {
  inspection: PreTripInspectionState
  setOdometer: (odometer: number | undefined) => void
  capturePhoto: (id: PreTripPhotoId) => void
  setAttested: (attested: boolean) => void
  completeInspection: () => boolean
  resetInspection: () => void
  vehicle: string
  postTrip: PostTripInspectionState
  history: VehicleInspectionState['history']
  saveError: boolean
  updatePostTrip: (patch: Partial<PostTripInspectionState>) => void
  completePostTrip: (unfinishedStops: number, acknowledged: boolean) => boolean
  startNextCycle: () => boolean
}

const STORAGE_KEY = 'zaberman-vehicle-inspections:v1'
const PreTripInspectionContext = createContext<PreTripInspectionContextValue | null>(null)

function readInspection(): VehicleInspectionState {
  try {
    return restoreVehicleInspection(localStorage.getItem(STORAGE_KEY), localStorage.getItem('zaberman-pre-trip-inspection:v1'))
  } catch {
    return emptyVehicleInspection
  }
}

export function PreTripInspectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readInspection)
  const [saveError, setSaveError] = useState(false)
  const save = (next: VehicleInspectionState) => {
    if (next === state) return false
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setState(next); setSaveError(false); return true
    } catch { setSaveError(true); return false }
  }
  const changePre = (patch: Partial<PreTripInspectionState>) => {
    if (state.inspection.completedAt || state.postTrip.completedAt) return
    save({ ...state, inspection: { ...state.inspection, ...patch, attested: patch.attested ?? false } })
  }
  const value: PreTripInspectionContextValue = {
    ...state, saveError,
    setOdometer: (odometer) => changePre({ odometer }),
    capturePhoto: (id) => changePre({ photos: [...new Set([...state.inspection.photos, id])] }),
    setAttested: (attested) => changePre({ attested }),
    completeInspection: () => {
      if (state.inspection.completedAt || !inspectionCanComplete(state.inspection)) return false
      return save({ ...state, inspection: { ...state.inspection, inspectedBy: inspectionDriver, completedAt: new Date().toISOString() } })
    },
    updatePostTrip: (patch) => {
      if (!state.inspection.completedAt || state.postTrip.completedAt) return
      save({ ...state, postTrip: { ...state.postTrip, ...patch, attested: patch.attested ?? false } })
    },
    completePostTrip: (unfinishedStops, acknowledged) => save(finishPostTrip(state, unfinishedStops, acknowledged, new Date().toISOString())),
    startNextCycle: () => save(startNextVehicleCycle(state)),
    resetInspection: () => { save(emptyVehicleInspection) },
  }

  return <PreTripInspectionContext.Provider value={value}>{children}</PreTripInspectionContext.Provider>
}

export function usePreTripInspection() {
  const value = useContext(PreTripInspectionContext)
  if (!value) throw new Error('usePreTripInspection must be used inside PreTripInspectionProvider')
  return value
}
