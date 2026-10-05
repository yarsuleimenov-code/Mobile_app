export type PreTripCheckId =
  | 'tires'
  | 'lights'
  | 'windows'
  | 'leaks'
  | 'body'
  | 'controls'
  | 'emergency'

export type PreTripPhotoId = 'front' | 'rear' | 'driver_side' | 'passenger_side' | 'dashboard'
export type PreTripAnswer = 'pass' | 'issue'

export interface PreTripInspectionState {
  answers: Partial<Record<PreTripCheckId, PreTripAnswer>>
  photos: PreTripPhotoId[]
  attested: boolean
  completedAt: string | null
}

export const preTripChecks: Array<{ id: PreTripCheckId; label: string; detail: string }> = [
  { id: 'tires', label: 'Tires & wheels', detail: 'Inflation, tread, visible damage and loose hardware' },
  { id: 'lights', label: 'Lights & reflectors', detail: 'Headlights, brake lights, signals and reflectors' },
  { id: 'windows', label: 'Windows, mirrors & wipers', detail: 'Clear view, secure mirrors and working wipers' },
  { id: 'leaks', label: 'Leaks under vehicle', detail: 'No visible fuel, oil or coolant leaks' },
  { id: 'body', label: 'Body, doors & cargo area', detail: 'Doors latch, body is secure and cargo area is clear' },
  { id: 'controls', label: 'Brakes, steering & horn', detail: 'Controls respond normally with no warning indicators' },
  { id: 'emergency', label: 'Emergency equipment', detail: 'Extinguisher, warning devices and first-aid kit present' },
]

export const preTripPhotos: Array<{ id: PreTripPhotoId; label: string; detail: string }> = [
  { id: 'front', label: 'Front', detail: 'Full front and windshield' },
  { id: 'rear', label: 'Rear', detail: 'Doors, lights and bumper' },
  { id: 'driver_side', label: 'Driver side', detail: 'Full side, wheels visible' },
  { id: 'passenger_side', label: 'Passenger side', detail: 'Full side, wheels visible' },
  { id: 'dashboard', label: 'Dashboard', detail: 'Instrument panel and any warning indicators' },
]

export const emptyPreTripInspection: PreTripInspectionState = {
  answers: {},
  photos: [],
  attested: false,
  completedAt: null,
}

export function inspectionHasIssue(state: PreTripInspectionState) {
  return Object.values(state.answers).includes('issue')
}

export function inspectionChecklistComplete(state: PreTripInspectionState) {
  return preTripChecks.every((item) => Boolean(state.answers[item.id]))
}

export function inspectionPhotosComplete(state: PreTripInspectionState) {
  return preTripPhotos.every((item) => state.photos.includes(item.id))
}

export function inspectionCanComplete(state: PreTripInspectionState) {
  return inspectionChecklistComplete(state)
    && inspectionPhotosComplete(state)
    && state.attested
    && !inspectionHasIssue(state)
}

export function inspectionStatus(state: PreTripInspectionState) {
  if (state.completedAt) return 'passed' as const
  if (inspectionHasIssue(state)) return 'blocked' as const
  if (Object.keys(state.answers).length || state.photos.length) return 'in_progress' as const
  return 'required' as const
}
