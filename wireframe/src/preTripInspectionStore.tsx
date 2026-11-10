import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  inspectionCanComplete,
  type PreTripInspectionState,
  type PreTripPhotoId,
} from './preTripInspectionDomain'
import { currentUser } from './currentUser'
import { emptyVehicleInspection, finishPostTrip, restoreVehicleInspection, startNextVehicleCycle, VEHICLE_INSPECTIONS_STORAGE_KEY, type PostTripInspectionState, type VehicleInspectionState } from './postTripInspectionDomain'
import { readRouteCompletion } from './routeStopProgress'
import { readSpokeRoute, routeForVehicleCycle } from './spokeRouteStore'
import { saveWorkflowChange } from './syncQueueStore'
import type { WorkflowChange } from './photoEvidenceDomain'

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
  startPostTrip: () => void
  updatePostTrip: (patch: Partial<PostTripInspectionState>) => void
  completePostTrip: (unfinishedStops: number, acknowledged: boolean) => boolean
  startNextCycle: () => boolean
}

const PreTripInspectionContext = createContext<PreTripInspectionContextValue | null>(null)

export function readVehicleInspection(storage?: Pick<Storage, 'getItem'>): VehicleInspectionState {
  try {
    const source = storage ?? localStorage
    return restoreVehicleInspection(source.getItem(VEHICLE_INSPECTIONS_STORAGE_KEY), source.getItem('zaberman-pre-trip-inspection:v1'))
  } catch {
    return emptyVehicleInspection
  }
}

export function PreTripInspectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readVehicleInspection)
  const [saveError, setSaveError] = useState(false)
  const save = (next: VehicleInspectionState, change?: WorkflowChange) => {
    if (next === state) return false
    try {
      if (change) saveWorkflowChange(VEHICLE_INSPECTIONS_STORAGE_KEY, next, change)
      else localStorage.setItem(VEHICLE_INSPECTIONS_STORAGE_KEY, JSON.stringify(next))
      setState(next); setSaveError(false); return true
    } catch { setSaveError(true); return false }
  }
  const changePre = (patch: Partial<PreTripInspectionState>) => {
    if (state.inspection.completedAt || state.postTrip.completedAt) return
    save({ ...state, inspection: { ...state.inspection, ...patch, attested: patch.attested ?? false } })
  }
  const changePost = (patch: Partial<PostTripInspectionState>) => {
    const current = readVehicleInspection()
    if (!current.inspection.completedAt || current.postTrip.completedAt) return
    const route = routeForVehicleCycle(readSpokeRoute(), current.inspection.completedAt)
    const routeCompletion = route ? readRouteCompletion(route) : undefined
    if (route && !routeCompletion) return
    const startedAt = current.postTrip.startedAt ?? new Date().toISOString()
    save({ ...current, postTrip: { ...current.postTrip, ...patch, attested: patch.attested ?? false, startedAt, routeCompletion } },
      current.postTrip.startedAt ? undefined : {
        id: `post-trip:${current.inspection.completedAt}`, label: 'Post-trip', detail: 'Inspection started', recordedAt: startedAt,
      })
  }
  const value: PreTripInspectionContextValue = {
    ...state, saveError,
    setOdometer: (odometer) => changePre({ odometer }),
    capturePhoto: (id) => changePre({ photos: [...new Set([...state.inspection.photos, id])] }),
    setAttested: (attested) => changePre({ attested }),
    completeInspection: () => {
      if (state.inspection.completedAt || !inspectionCanComplete(state.inspection)) return false
      const completedAt = new Date().toISOString()
      return save({ ...state, inspection: { ...state.inspection, inspectedBy: currentUser.name, completedAt } }, {
        id: `pre-trip:${completedAt}`, label: 'Pre-trip', detail: 'Inspection completed', recordedAt: completedAt,
      })
    },
    startPostTrip: () => {
      const current = readVehicleInspection().postTrip
      if (!current.startedAt) changePost({ attested: current.attested })
    },
    updatePostTrip: changePost,
    completePostTrip: (unfinishedStops, acknowledged) => {
      const current = readVehicleInspection()
      const route = routeForVehicleCycle(readSpokeRoute(), current.inspection.completedAt)
      const routeCompletion = route ? readRouteCompletion(route) : undefined
      if (route && !routeCompletion) return false
      const completedAt = new Date().toISOString()
      const next = finishPostTrip(current, unfinishedStops, acknowledged, completedAt)
      return next !== current && save({ ...next, postTrip: { ...next.postTrip, routeCompletion } }, {
        id: `post-trip:${current.inspection.completedAt}`, label: 'Post-trip', detail: 'Inspection completed',
        startedAt: next.postTrip.startedAt, recordedAt: completedAt,
      })
    },
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
