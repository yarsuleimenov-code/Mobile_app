import { describe, expect, it } from 'vitest'
import { legacyPreTripChecks, legacyPreTripPhotos, preTripChecks, preTripPhotos } from './preTripInspectionDomain'
import { emptyVehicleInspection, finishPostTrip, postTripCanComplete, postTripChecks, postTripPhotos, restoreVehicleInspection, startNextVehicleCycle, type VehicleInspectionState } from './postTripInspectionDomain'

function ready(): VehicleInspectionState {
  return { ...emptyVehicleInspection,
    inspection: { answers: {}, odometer: 12450, inspectedBy: 'Chris Adams', photos: preTripPhotos.map((item) => item.id), attested: true, completedAt: '2026-10-05T08:00:00Z' },
    postTrip: { ...emptyVehicleInspection.postTrip, answers: {}, odometer: 12610, photos: postTripPhotos.map((item) => item.id), attested: true },
  }
}
function legacyReady(): VehicleInspectionState {
  const state = ready()
  const answers = Object.fromEntries(legacyPreTripChecks.map(({ id }) => [id, 'pass']))
  const photos = legacyPreTripPhotos.map(({ id }) => id)
  return { ...state, inspection: { ...state.inspection, answers: { ...answers }, photos: [...photos], odometer: undefined, inspectedBy: undefined },
    postTrip: { ...state.postTrip, answers, photos, odometer: undefined } }
}
describe('post-trip vehicle cycle', () => {
  it('requires a completed pre-trip', () => {
    const state = { ...ready(), inspection: emptyVehicleInspection.inspection }
    expect(finishPostTrip(state, 0, false, 'now')).toBe(state)
  })
  it('requires all thirteen photos, a final odometer reading and attestation', () => {
    const post = ready().postTrip
    expect(postTripCanComplete(post)).toBe(true)
    expect(postTripCanComplete({ ...post, photos: post.photos.filter((id) => id !== 'tires') })).toBe(false)
    expect(postTripCanComplete({ ...post, odometer: undefined })).toBe(false)
    expect(postTripCanComplete({ ...post, attested: false })).toBe(false)
  })
  it('rejects an ending odometer below the start and saves the responsible driver', () => {
    const state = ready()
    state.postTrip.odometer = 12449
    expect(finishPostTrip(state, 0, false, 'now')).toBe(state)
    state.postTrip.odometer = 12450
    expect(finishPostTrip(state, 0, false, 'now').postTrip).toMatchObject({
      odometer: 12450, inspectedBy: 'Chris Adams', completedAt: 'now',
    })
  })

  it('accepts a valid ending reading after an older Pre-trip without mileage', () => {
    const state = ready()
    state.inspection.odometer = undefined
    expect(finishPostTrip(state, 0, false, 'now').postTrip.completedAt).toBe('now')
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
    const { inspection } = legacyReady()
    expect(restoreVehicleInspection(null, JSON.stringify(inspection)).inspection).toEqual(inspection)
  })
  it('preserves a completed thirteen-photo cycle from before odometer capture', () => {
    const state = ready()
    state.inspection = { ...state.inspection, answers: Object.fromEntries(preTripChecks.map(({ id }) => [id, 'pass'])), odometer: undefined, inspectedBy: undefined }
    state.postTrip = { ...state.postTrip, answers: Object.fromEntries(postTripChecks.map(({ id }) => [id, 'pass'])), odometer: undefined, completedAt: '2026-10-05T18:00:00Z' }
    expect(restoreVehicleInspection(JSON.stringify(state), null)).toEqual(state)
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
    const state = legacyReady()
    state.inspection.photos = state.inspection.photos.filter((id) => id !== 'dashboard')
    const restored = restoreVehicleInspection(JSON.stringify(state), null)
    expect(restored.inspection.completedAt).toBeNull()
    expect(restored.inspection.attested).toBe(false)
    expect(restored.inspection.photos).toHaveLength(4)
    expect(restoreVehicleInspection(null, JSON.stringify(state.inspection)).inspection.completedAt).toBeNull()
  })

  it('preserves finalized and archived cycles with historical four-photo pre-trips', () => {
    const state = legacyReady()
    state.postTrip.completedAt = '2026-10-05T18:00:00Z'
    state.inspection.photos = state.inspection.photos.filter((id) => id !== 'dashboard')
    expect(restoreVehicleInspection(JSON.stringify(state), null).inspection).toEqual(state.inspection)
    const next = startNextVehicleCycle(state)
    expect(restoreVehicleInspection(JSON.stringify(next), null).history[0]).toEqual(next.history[0])
    expect(postTripPhotos).toHaveLength(13)
    expect(new Set(postTripPhotos.map((item) => item.id)).size).toBe(13)
  })

  it('keeps compatible draft progress and requires new photos before completion', () => {
    const state = legacyReady()
    state.inspection.completedAt = null
    state.inspection.answers.equipment = 'issue'
    const restored = restoreVehicleInspection(JSON.stringify(state), null)
    expect(restored.inspection.completedAt).toBeNull()
    expect(restored.inspection.attested).toBe(false)
    expect(restored.inspection.answers.equipment).toBeUndefined()
    expect(restored.inspection.answers.lights).toBe('pass')
    expect(restored.inspection.photos).toHaveLength(5)
  })

  it('preserves historical checks and reported equipment issues in completed cycles', () => {
    const state = legacyReady()
    state.postTrip.completedAt = '2026-10-05T18:00:00Z'
    delete state.inspection.answers.equipment
    state.postTrip.answers.equipment = 'issue'
    state.postTrip.issues.equipment = 'Missing equipment'
    const archived = startNextVehicleCycle(state)
    expect(restoreVehicleInspection(JSON.stringify(archived), null).history[0]).toEqual(archived.history[0])
    expect(postTripChecks).toHaveLength(4)
    expect(postTripChecks.some((item) => item.id === 'equipment')).toBe(false)
  })
})
