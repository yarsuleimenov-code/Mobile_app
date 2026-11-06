import { emptyPreTripInspection, inspectionCanComplete, inspectionDriver, inspectionPhotosComplete, isOdometerReading, legacyPreTripChecks, legacyPreTripPhotos, preTripChecks, preTripPhotos, type PreTripAnswer, type PreTripCheckId, type PreTripInspectionState, type PreTripPhotoId } from './preTripInspectionDomain'

export type PostTripCheckId = PreTripCheckId | 'equipment'
export type PostTripPhotoId = PreTripPhotoId | 'dashboard'
export interface PostTripInspectionState {
  answers: Partial<Record<PostTripCheckId, PreTripAnswer>>
  issues: Partial<Record<PostTripCheckId, string>>
  photos: PostTripPhotoId[]
  odometer?: number
  inspectedBy?: string
  attested: boolean
  completedAt: string | null
  unfinishedStops: number
}
export interface VehicleCycle {
  vehicle: string
  inspection: PreTripInspectionState
  postTrip: PostTripInspectionState
}
export interface VehicleInspectionState extends VehicleCycle { history: VehicleCycle[] }
export const postTripChecks = preTripChecks
export const postTripPhotos = preTripPhotos
export const emptyPostTripInspection: PostTripInspectionState = { answers: {}, issues: {}, photos: [], attested: false, completedAt: null, unfinishedStops: 0 }
export const emptyVehicleInspection: VehicleInspectionState = { vehicle: 'Van 08 · Extended Van · NJ1', inspection: emptyPreTripInspection, postTrip: emptyPostTripInspection, history: [] }
export function postTripCanComplete(state: PostTripInspectionState, startOdometer?: number) {
  return isOdometerReading(state.odometer) && (startOdometer === undefined || state.odometer >= startOdometer)
    && inspectionPhotosComplete(state) && state.attested
}
export function finishPostTrip(state: VehicleInspectionState, unfinishedStops: number, acknowledged: boolean, at: string): VehicleInspectionState {
  if (!state.inspection.completedAt || state.postTrip.completedAt || !postTripCanComplete(state.postTrip, state.inspection.odometer) || (unfinishedStops > 0 && !acknowledged)) return state
  return { ...state, postTrip: { ...state.postTrip, inspectedBy: inspectionDriver, completedAt: at, unfinishedStops } }
}
export function startNextVehicleCycle(state: VehicleInspectionState): VehicleInspectionState {
  if (!state.postTrip.completedAt) return state
  return { ...emptyVehicleInspection, vehicle: state.vehicle, history: [...state.history, { vehicle: state.vehicle, inspection: state.inspection, postTrip: state.postTrip }] }
}
export function restoreVehicleInspection(raw: string | null, legacy: string | null): VehicleInspectionState {
  try {
    const value = JSON.parse(raw ?? legacy ?? 'null')
    if (!value || typeof value !== 'object') return emptyVehicleInspection
    const normalizePre = (source: PreTripInspectionState, completedCycle = false): PreTripInspectionState => {
      const answers = Object.fromEntries(legacyPreTripChecks.filter((item) => ['pass', 'issue'].includes(source?.answers?.[item.id] ?? '')).map((item) => [item.id, source.answers[item.id]]))
      const photos = preTripPhotos.filter((item) => Array.isArray(source?.photos) && source.photos.includes(item.id)).map((item) => item.id)
      const currentAnswers = Object.fromEntries(preTripChecks.filter(({ id }) => answers[id]).map(({ id }) => [id, answers[id]]))
      const draft = { answers: currentAnswers, photos, attested: source?.attested === true, completedAt: null,
        odometer: isOdometerReading(source?.odometer) ? source.odometer : undefined,
        inspectedBy: typeof source?.inspectedBy === 'string' ? source.inspectedBy : undefined }
      const legacyPass = draft.attested
        && legacyPreTripChecks.every(({ id }) => answers[id] === 'pass' || (completedCycle && id === 'equipment' && answers[id] === undefined))
        && legacyPreTripPhotos.every(({ id }) => photos.includes(id) || (completedCycle && id === 'dashboard'))
      const currentPass = inspectionCanComplete(draft)
      const previousPass = draft.attested && inspectionPhotosComplete(draft)
        && preTripChecks.every(({ id }) => currentAnswers[id] === 'pass')
      if (typeof source?.completedAt === 'string' && (currentPass || (source.odometer === undefined && (previousPass || legacyPass)))) {
        return { ...draft, answers: legacyPass && !previousPass ? answers : currentAnswers, completedAt: source.completedAt }
      }
      return { ...draft, attested: currentPass }
    }
    const normalizeCycle = (source: VehicleCycle): VehicleCycle => {
      const p = source?.postTrip
      const postTrip: PostTripInspectionState = {
        ...emptyPostTripInspection,
        answers: Object.fromEntries(legacyPreTripChecks.filter((item) => ['pass', 'issue'].includes(p?.answers?.[item.id] ?? '')).map((item) => [item.id, p.answers[item.id]])),
        issues: Object.fromEntries(legacyPreTripChecks.filter((item) => typeof p?.issues?.[item.id] === 'string').map((item) => [item.id, p.issues[item.id]!.slice(0, 1000)])),
        photos: postTripPhotos.filter((item) => Array.isArray(p?.photos) && p.photos.includes(item.id)).map((item) => item.id),
        attested: p?.attested === true,
        odometer: isOdometerReading(p?.odometer) ? p.odometer : undefined,
        inspectedBy: typeof p?.inspectedBy === 'string' ? p.inspectedBy : undefined,
        unfinishedStops: Number.isInteger(p?.unfinishedStops) && p.unfinishedStops >= 0 ? p.unfinishedStops : 0,
      }
      const currentPostTrip = {
        ...postTrip,
        answers: Object.fromEntries(postTripChecks.filter(({ id }) => postTrip.answers[id]).map(({ id }) => [id, postTrip.answers[id]])),
        issues: Object.fromEntries(postTripChecks.filter(({ id }) => postTrip.issues[id] !== undefined).map(({ id }) => [id, postTrip.issues[id]])),
      }
      const checkRecorded = ({ id }: { id: PreTripCheckId }) => postTrip.answers[id] === 'pass'
        || (postTrip.answers[id] === 'issue' && Boolean(postTrip.issues[id]?.trim()))
      const legacyComplete = postTrip.attested && legacyPreTripChecks.every(checkRecorded)
        && legacyPreTripPhotos.every(({ id }) => postTrip.photos.includes(id))
      const previousComplete = postTrip.attested && postTripChecks.every(checkRecorded) && inspectionPhotosComplete(postTrip)
      const currentComplete = postTripCanComplete(currentPostTrip)
      const completedCycle = typeof p?.completedAt === 'string'
        && (currentComplete || (p.odometer === undefined && (previousComplete || legacyComplete)))
      const inspection = normalizePre(source?.inspection, completedCycle)
      const restoredPostTrip = completedCycle && legacyComplete && !previousComplete && !currentComplete ? postTrip : currentPostTrip
      const odometerValid = inspection.odometer === undefined || postTrip.odometer === undefined
        || postTrip.odometer >= inspection.odometer
      if (inspection.completedAt && completedCycle && odometerValid) restoredPostTrip.completedAt = p.completedAt
      else if (!currentComplete || !odometerValid) restoredPostTrip.attested = false
      return { vehicle: emptyVehicleInspection.vehicle, inspection, postTrip: restoredPostTrip }
    }
    if (!raw) return { ...emptyVehicleInspection, inspection: normalizePre(value) }
    return { ...normalizeCycle(value), history: Array.isArray(value.history) ? value.history.map(normalizeCycle).filter((cycle: VehicleCycle) => cycle.postTrip.completedAt) : [] }
  } catch { return emptyVehicleInspection }
}
