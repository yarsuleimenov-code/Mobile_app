import { describe, expect, it } from 'vitest'
import {
  emptyPreTripInspection,
  inspectionCanComplete,
  inspectionChecklistComplete,
  inspectionHasIssue,
  inspectionPhotosComplete,
  inspectionStatus,
  preTripChecks,
  preTripPhotos,
  type PreTripInspectionState,
} from './preTripInspectionDomain'

function completeInspection(overrides: Partial<PreTripInspectionState> = {}): PreTripInspectionState {
  return {
    answers: Object.fromEntries(preTripChecks.map((item) => [item.id, 'pass'])),
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

  it('requires every checklist item and photo', () => {
    const inspection = completeInspection({ photos: preTripPhotos.slice(0, 3).map((item) => item.id) })
    expect(inspectionChecklistComplete(inspection)).toBe(true)
    expect(inspectionPhotosComplete(inspection)).toBe(false)
    expect(inspectionCanComplete(inspection)).toBe(false)
  })

  it('blocks completion when an issue is reported', () => {
    const inspection = completeInspection({ answers: { ...completeInspection().answers, tires: 'issue' } })
    expect(inspectionHasIssue(inspection)).toBe(true)
    expect(inspectionStatus(inspection)).toBe('blocked')
    expect(inspectionCanComplete(inspection)).toBe(false)
  })

  it('requires dashboard even when all four exterior photos are captured', () => {
    const inspection = completeInspection({ photos: preTripPhotos.filter((item) => item.id !== 'dashboard').map((item) => item.id) })
    expect(inspectionPhotosComplete(inspection)).toBe(false)
    expect(inspectionCanComplete(inspection)).toBe(false)
    expect(inspectionCanComplete({ ...inspection, photos: [...inspection.photos, 'dashboard'] })).toBe(true)
  })

  it('allows a fully passed and attested inspection', () => {
    const inspection = completeInspection()
    expect(inspectionCanComplete(inspection)).toBe(true)
    expect(inspectionStatus({ ...inspection, completedAt: '2026-09-28T08:06:00Z' })).toBe('passed')
  })
})
