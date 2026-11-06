import { describe, expect, it } from 'vitest'
import {
  emptyPreTripInspection,
  inspectionCanComplete,
  inspectionDistance,
  inspectionPhotosComplete,
  inspectionStatus,
  isOdometerReading,
  preTripPhotos,
  type PreTripInspectionState,
} from './preTripInspectionDomain'

function completeInspection(overrides: Partial<PreTripInspectionState> = {}): PreTripInspectionState {
  return {
    answers: {},
    odometer: 12450,
    photos: preTripPhotos.map((item) => item.id),
    attested: true,
    completedAt: null,
    ...overrides,
  }
}

describe('pre-trip inspection', () => {
  it('keeps a new route locked', () => {
    expect(inspectionStatus(emptyPreTripInspection)).toBe('required')
    expect(inspectionCanComplete(emptyPreTripInspection)).toBe(false)
  })

  it('requires all photos and driver attestation', () => {
    const inspection = completeInspection({ photos: preTripPhotos.slice(0, 3).map((item) => item.id) })
    expect(inspectionPhotosComplete(inspection)).toBe(false)
    expect(inspectionCanComplete(inspection)).toBe(false)
    expect(inspectionCanComplete(completeInspection({ attested: false }))).toBe(false)
  })

  it('requires the Milwaukee bag photo even when the other twelve are captured', () => {
    const inspection = completeInspection({ photos: preTripPhotos.filter((item) => item.id !== 'milwaukee_bag').map((item) => item.id) })
    expect(inspectionPhotosComplete(inspection)).toBe(false)
    expect(inspectionCanComplete(inspection)).toBe(false)
    expect(inspectionCanComplete({ ...inspection, photos: [...inspection.photos, 'milwaukee_bag'] })).toBe(true)
  })

  it('requires a nonnegative whole-mile odometer reading', () => {
    for (const odometer of [undefined, -1, 3.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(isOdometerReading(odometer)).toBe(false)
      expect(inspectionCanComplete(completeInspection({ odometer }))).toBe(false)
    }
    expect(inspectionCanComplete(completeInspection({ odometer: 0 }))).toBe(true)
  })

  it('calculates the difference only when both readings are known and in sequence', () => {
    expect(inspectionDistance(12450, 12610)).toBe(160)
    expect(inspectionDistance(12450, 12450)).toBe(0)
    expect(inspectionDistance(undefined, 12610)).toBeUndefined()
    expect(inspectionDistance(12610, 12450)).toBeUndefined()
  })

  it('allows a fully photographed and attested inspection', () => {
    const inspection = completeInspection()
    expect(inspectionCanComplete(inspection)).toBe(true)
    expect(inspectionStatus({ ...inspection, completedAt: '2026-09-28T08:06:00Z' })).toBe('passed')
  })
})
