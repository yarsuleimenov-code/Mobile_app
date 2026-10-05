import { emptyPreTripInspection, inspectionCanComplete, preTripChecks, preTripPhotos, type PreTripAnswer, type PreTripCheckId, type PreTripInspectionState, type PreTripPhotoId } from './preTripInspectionDomain'

export type PostTripCheckId = PreTripCheckId | 'equipment'
export type PostTripPhotoId = PreTripPhotoId | 'dashboard'
export interface PostTripInspectionState {
  answers: Partial<Record<PostTripCheckId, PreTripAnswer>>
  issues: Partial<Record<PostTripCheckId, string>>
  photos: PostTripPhotoId[]
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
export const postTripChecks = [...preTripChecks, { id: 'equipment' as const, label: 'Company equipment & tools', detail: 'Confirm assigned tools and moving equipment are returned to the vehicle' }]
export const postTripPhotos = preTripPhotos
export const emptyPostTripInspection: PostTripInspectionState = { answers: {}, issues: {}, photos: [], attested: false, completedAt: null, unfinishedStops: 0 }
export const emptyVehicleInspection: VehicleInspectionState = { vehicle: 'Van 08 · Extended Van · NJ1', inspection: emptyPreTripInspection, postTrip: emptyPostTripInspection, history: [] }
export function postTripIssues(state: PostTripInspectionState) { return postTripChecks.filter((item) => state.answers[item.id] === 'issue') }
export function postTripChecklistComplete(state: PostTripInspectionState) {
  return postTripChecks.every((item) => ['pass', 'issue'].includes(state.answers[item.id] ?? '') && (state.answers[item.id] !== 'issue' || Boolean(state.issues[item.id]?.trim())))
}
export function postTripCanComplete(state: PostTripInspectionState) {
  return postTripChecklistComplete(state) && postTripPhotos.every((item) => state.photos.includes(item.id)) && state.attested
}
export function finishPostTrip(state: VehicleInspectionState, unfinishedStops: number, acknowledged: boolean, at: string): VehicleInspectionState {
  if (!state.inspection.completedAt || state.postTrip.completedAt || !postTripCanComplete(state.postTrip) || (unfinishedStops > 0 && !acknowledged)) return state
  return { ...state, postTrip: { ...state.postTrip, completedAt: at, unfinishedStops } }
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
      const answers = Object.fromEntries(preTripChecks.filter((item) => ['pass', 'issue'].includes(source?.answers?.[item.id] ?? '')).map((item) => [item.id, source.answers[item.id]]))
      const photos = preTripPhotos.filter((item) => Array.isArray(source?.photos) && source.photos.includes(item.id)).map((item) => item.id)
      const draft = { answers, photos, attested: source?.attested === true, completedAt: null }
      const historicalPass = completedCycle && draft.attested && preTripChecks.every((item) => answers[item.id] === 'pass') && preTripPhotos.filter((item) => item.id !== 'dashboard').every((item) => photos.includes(item.id))
      const completedAt = (inspectionCanComplete(draft) || historicalPass) && typeof source?.completedAt === 'string' ? source.completedAt : null
      return { ...draft, attested: source?.completedAt && !completedAt ? false : draft.attested, completedAt }
    }
    const normalizeCycle = (source: VehicleCycle): VehicleCycle => {
      const p = source?.postTrip
      const postTrip: PostTripInspectionState = {
        ...emptyPostTripInspection,
        answers: Object.fromEntries(postTripChecks.filter((item) => ['pass', 'issue'].includes(p?.answers?.[item.id] ?? '')).map((item) => [item.id, p.answers[item.id]])),
        issues: Object.fromEntries(postTripChecks.filter((item) => typeof p?.issues?.[item.id] === 'string').map((item) => [item.id, p.issues[item.id]!.slice(0, 1000)])),
        photos: postTripPhotos.filter((item) => Array.isArray(p?.photos) && p.photos.includes(item.id)).map((item) => item.id),
        attested: p?.attested === true,
        unfinishedStops: Number.isInteger(p?.unfinishedStops) && p.unfinishedStops >= 0 ? p.unfinishedStops : 0,
      }
      const inspection = normalizePre(source?.inspection, typeof p?.completedAt === 'string' && postTripCanComplete(postTrip))
      if (inspection.completedAt && postTripCanComplete(postTrip) && typeof p?.completedAt === 'string') postTrip.completedAt = p.completedAt
      return { vehicle: emptyVehicleInspection.vehicle, inspection, postTrip }
    }
    if (!raw) return { ...emptyVehicleInspection, inspection: normalizePre(value) }
    return { ...normalizeCycle(value), history: Array.isArray(value.history) ? value.history.map(normalizeCycle).filter((cycle: VehicleCycle) => cycle.postTrip.completedAt) : [] }
  } catch { return emptyVehicleInspection }
}
