export type PreTripCheckId =
  | 'tires'
  | 'lights'
  | 'windows'
  | 'leaks'
  | 'body'
  | 'controls'
  | 'emergency'
  | 'equipment'

export type PreTripPhotoId = typeof preTripPhotos[number]['id']
export type PreTripAnswer = 'pass' | 'issue'

export interface PreTripInspectionState {
  answers: Partial<Record<PreTripCheckId, PreTripAnswer>>
  photos: PreTripPhotoId[]
  odometer?: number
  inspectedBy?: string
  attested: boolean
  completedAt: string | null
}

export const legacyPreTripChecks: Array<{ id: PreTripCheckId; label: string; detail: string }> = [
  { id: 'tires', label: 'Tires & wheels', detail: 'Inflation, tread, visible damage and loose hardware' },
  { id: 'lights', label: 'Lights & reflectors', detail: 'Headlights, brake lights, signals and reflectors' },
  { id: 'windows', label: 'Windows, mirrors & wipers', detail: 'Clear view, secure mirrors and working wipers' },
  { id: 'leaks', label: 'Leaks under vehicle', detail: 'No visible fuel, oil or coolant leaks' },
  { id: 'body', label: 'Body, doors & cargo area', detail: 'Doors latch, body is secure and cargo area is clear' },
  { id: 'controls', label: 'Brakes, steering & horn', detail: 'Controls respond normally with no warning indicators' },
  { id: 'emergency', label: 'Emergency equipment', detail: 'Extinguisher, warning devices and first-aid kit present' },
  { id: 'equipment', label: 'Company equipment & tools', detail: 'Confirm assigned tools and moving equipment are present before departure' },
]

export const preTripChecks = legacyPreTripChecks.filter(({ id }) =>
  id === 'lights' || id === 'windows' || id === 'leaks' || id === 'emergency',
)

export const legacyPreTripPhotos = [
  { id: 'front', label: 'Front', detail: 'Full front and windshield' },
  { id: 'rear', label: 'Rear', detail: 'Doors, lights and bumper' },
  { id: 'driver_side', label: 'Driver side', detail: 'Full side, wheels visible' },
  { id: 'passenger_side', label: 'Passenger side', detail: 'Full side, wheels visible' },
  { id: 'dashboard', label: 'Dashboard', detail: 'Instrument panel and any warning indicators' },
] as const

export const equipmentInspectionPhotos = [
  { id: 'tires', label: 'Tires & wheels' },
  { id: 'dollies', label: '2x Dollies' },
  { id: 'hand_truck', label: 'Hand truck' },
  { id: 'scales', label: 'Scales' },
  { id: 'utility_knives_tape', label: '2x Utility knifes/Measuring tape' },
  { id: 'lamp', label: 'Lamp' },
  { id: 'dewalt_case', label: 'DeWalt case' },
  { id: 'milwaukee_bag', label: 'Milwaukee open bag' },
] as const satisfies ReadonlyArray<{ id: string; label: string; detail?: string }>

export const preTripPhotos = [...legacyPreTripPhotos, ...equipmentInspectionPhotos] as const

export const emptyPreTripInspection: PreTripInspectionState = {
  answers: {},
  photos: [],
  attested: false,
  completedAt: null,
}

export function isOdometerReading(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function formatInspectionMiles(value: number | undefined) {
  return value === undefined ? 'Not recorded' : `${value.toLocaleString('en-US')} mi`
}

export function inspectionDistance(start: number | undefined, end: number | undefined) {
  return start !== undefined && end !== undefined && end >= start ? end - start : undefined
}

export function inspectionPhotosComplete(state: PreTripInspectionState) {
  return preTripPhotos.every((item) => state.photos.includes(item.id))
}

export function inspectionCanComplete(state: PreTripInspectionState) {
  return isOdometerReading(state.odometer) && inspectionPhotosComplete(state) && state.attested
}

export function inspectionStatus(state: PreTripInspectionState) {
  if (state.completedAt) return 'passed' as const
  if (state.odometer !== undefined || state.photos.length) return 'in_progress' as const
  return 'required' as const
}
