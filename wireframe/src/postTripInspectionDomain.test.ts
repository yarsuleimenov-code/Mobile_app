import { describe, expect, it } from 'vitest'
import { preTripChecks, preTripPhotos } from './preTripInspectionDomain'
import { emptyVehicleInspection, finishPostTrip, postTripCanComplete, postTripChecks, postTripPhotos, restoreVehicleInspection, startNextVehicleCycle, type VehicleInspectionState } from './postTripInspectionDomain'

function ready(): VehicleInspectionState {
  return { ...emptyVehicleInspection,
    inspection: { answers: Object.fromEntries(preTripChecks.map((item) => [item.id, 'pass'])), photos: preTripPhotos.map((item) => item.id), attested: true, completedAt: '2026-10-05T08:00:00Z' },
    postTrip: { ...emptyVehicleInspection.postTrip, answers: Object.fromEntries(postTripChecks.map((item) => [item.id, 'pass'])), photos: postTripPhotos.map((item) => item.id), attested: true },
  }
}
describe('post-trip vehicle cycle', () => {
  it('requires a completed pre-trip', () => {
    const state = { ...ready(), inspection: emptyVehicleInspection.inspection }
    expect(finishPostTrip(state, 0, false, 'now')).toBe(state)
  })
  it('requires all five photos, all checks and attestation', () => {
    const post = ready().postTrip
    expect(postTripCanComplete(post)).toBe(true)
    expect(postTripCanComplete({ ...post, photos: post.photos.filter((id) => id !== 'dashboard') })).toBe(false)
    expect(postTripCanComplete({ ...post, answers: { ...post.answers, equipment: undefined } })).toBe(false)
    expect(postTripCanComplete({ ...post, attested: false })).toBe(false)
  })
  it('requires an issue description, but allows submission with defects', () => {
    const state = ready()
    state.postTrip.answers.tires = 'issue'
    expect(postTripCanComplete(state.postTrip)).toBe(false)
    state.postTrip.issues.tires = '  '
    expect(postTripCanComplete(state.postTrip)).toBe(false)
    state.postTrip.issues.tires = 'Rear tire damaged'
    expect(finishPostTrip(state, 0, false, '2026-10-05T18:00:00Z').postTrip.completedAt).toBeTruthy()
  })
  it('requires explicit acknowledgement of unfinished stops', () => {
    const state = ready()
    expect(finishPostTrip(state, 3, false, 'now')).toBe(state)
    expect(finishPostTrip(state, 3, true, 'now').postTrip.unfinishedStops).toBe(3)
  })
  it('does not replace a finalized result', () => {
    const state = finishPostTrip(ready(), 0, false, 'first')
    expect(finishPostTrip(state, 0, false, 'second')).toBe(state)
  })
  it('does not start another cycle before post-trip completion', () => {
    const state = ready()
    expect(startNextVehicleCycle(state)).toBe(state)
  })
  it('archives both records and requires a fresh pre-trip', () => {
    const completed = finishPostTrip(ready(), 0, false, '2026-10-05T18:00:00Z')
    const next = startNextVehicleCycle(completed)
    expect(next.inspection.completedAt).toBeNull()
    expect(next.postTrip.completedAt).toBeNull()
    expect(next.history[0].inspection).toEqual(completed.inspection)
    expect(next.history[0].postTrip).toEqual(completed.postTrip)
  })
  it('restores current and archived cycles after refresh', () => {
    const next = startNextVehicleCycle(finishPostTrip(ready(), 0, false, '2026-10-05T18:00:00Z'))
    expect(restoreVehicleInspection(JSON.stringify(next), null)).toEqual(next)
  })
  it('migrates a valid legacy pre-trip without discarding it', () => {
    expect(restoreVehicleInspection(null, JSON.stringify(ready().inspection)).inspection).toEqual(ready().inspection)
  })
  it('rejects malformed stored data and invalid completion flags', () => {
    expect(restoreVehicleInspection('{broken', null)).toEqual(emptyVehicleInspection)
    expect(restoreVehicleInspection(null, '{"completedAt":"now","attested":true}').inspection.completedAt).toBeNull()
    const state = ready()
    state.postTrip.photos = []
    state.postTrip.completedAt = 'now'
    expect(restoreVehicleInspection(JSON.stringify(state), null).postTrip.completedAt).toBeNull()
  })

  it('requires dashboard and a fresh attestation for an old active four-photo pre-trip', () => {
    const state = ready()
    state.inspection.photos = state.inspection.photos.filter((id) => id !== 'dashboard')
    const restored = restoreVehicleInspection(JSON.stringify(state), null)
    expect(restored.inspection.completedAt).toBeNull()
    expect(restored.inspection.attested).toBe(false)
    expect(restored.inspection.photos).toHaveLength(4)
    expect(restoreVehicleInspection(null, JSON.stringify(state.inspection)).inspection.completedAt).toBeNull()
  })

  it('preserves finalized and archived cycles with historical four-photo pre-trips', () => {
    const state = finishPostTrip(ready(), 0, false, '2026-10-05T18:00:00Z')
    state.inspection.photos = state.inspection.photos.filter((id) => id !== 'dashboard')
    expect(restoreVehicleInspection(JSON.stringify(state), null).inspection).toEqual(state.inspection)
    const next = startNextVehicleCycle(state)
    expect(restoreVehicleInspection(JSON.stringify(next), null).history[0]).toEqual(next.history[0])
    expect(postTripPhotos.map((item) => item.id)).toHaveLength(5)
    expect(new Set(postTripPhotos.map((item) => item.id)).size).toBe(5)
  })

  it('requires equipment confirmation and fresh attestation for an old active pre-trip', () => {
    const state = ready()
    delete state.inspection.answers.equipment
    const restored = restoreVehicleInspection(JSON.stringify(state), null)
    expect(restored.inspection.completedAt).toBeNull()
    expect(restored.inspection.attested).toBe(false)
    expect(restored.inspection.answers.equipment).toBeUndefined()
    expect(restored.inspection.photos).toHaveLength(5)
  })

  it('preserves historical seven-check pre-trips without duplicating post-trip equipment', () => {
    const state = finishPostTrip(ready(), 0, false, '2026-10-05T18:00:00Z')
    delete state.inspection.answers.equipment
    const archived = startNextVehicleCycle(state)
    expect(restoreVehicleInspection(JSON.stringify(archived), null).history[0]).toEqual(archived.history[0])
    expect(postTripChecks).toHaveLength(8)
    expect(postTripChecks.filter((item) => item.id === 'equipment')).toHaveLength(1)
  })
})
