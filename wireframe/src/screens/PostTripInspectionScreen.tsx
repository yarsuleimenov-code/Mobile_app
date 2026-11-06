import { AlertTriangle, Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CargoFlowHeader } from '../cargo-components'
import { useCargo } from '../cargoStore'
import { InspectionCaptureForm, InspectionPhotoRecord } from '../InspectionCaptureForm'
import { readOrderEbols } from '../orderEbolStore'
import { postTripCanComplete, postTripPhotos } from '../postTripInspectionDomain'
import { formatInspectionMiles, inspectionDistance, inspectionDriver, legacyPreTripChecks } from '../preTripInspectionDomain'
import { usePreTripInspection } from '../preTripInspectionStore'

export function PostTripInspectionScreen() {
  const store = usePreTripInspection()
  const [params] = useSearchParams()
  const archived = params.has('cycle') ? store.history[Number(params.get('cycle'))] : undefined
  const cycle = archived ?? store
  const post = cycle.postTrip
  const [acknowledged, setAcknowledged] = useState(false)
  const { spokeRoute } = useCargo()
  const header = <CargoFlowHeader title="Post-trip inspection" subtitle={cycle.vehicle} />

  if ((params.has('cycle') && !archived) || !cycle.inspection.completedAt) return <div className="cargo-flow pretrip-flow">{header}
    <main className="pretrip-body"><h1>{params.has('cycle') ? 'Inspection not found' : 'Pre-trip inspection required'}</h1><p>Complete the vehicle’s Pre-trip before recording its Post-trip.</p><Link className="ebol-secondary" to="/">Back to Home</Link></main>
  </div>

  const startOdometer = cycle.inspection.odometer
  const distance = inspectionDistance(startOdometer, post.odometer)
  const mileageRows = <>
    <div><dt>Start odometer</dt><dd>{formatInspectionMiles(startOdometer)}</dd></div>
    <div><dt>End odometer</dt><dd>{formatInspectionMiles(post.odometer)}</dd></div>
    {distance !== undefined ? <div><dt>Trip distance</dt><dd>{formatInspectionMiles(distance)}</dd></div> : null}
  </>
  const recordedChecks = legacyPreTripChecks.filter(({ id }) => post.answers[id])
  const hasIssues = recordedChecks.some(({ id }) => post.answers[id] === 'issue')

  if (post.completedAt) return <div className="cargo-flow pretrip-flow">{header}
    <main className="pretrip-body">
      <div className={`pretrip-review-state ${hasIssues ? 'is-blocked' : ''}`}>
        <span>{hasIssues ? <AlertTriangle size={28} /> : <Check size={28} />}</span>
        <p className="pretrip-eyebrow">POST-TRIP RECORDED</p><h1>{hasIssues ? 'Completed — issues reported' : 'Post-trip completed'}</h1>
        <p>{hasIssues ? 'Report the recorded issues to dispatch before the next departure.' : 'Vehicle condition and equipment have been recorded.'}</p>
      </div>
      <dl className="pretrip-review-list">
        <div><dt>Vehicle</dt><dd>{cycle.vehicle}</dd></div>
        <div><dt>Inspected by</dt><dd>{post.inspectedBy ?? 'Not recorded'}</dd></div>
        <div><dt>Pre-trip completed</dt><dd>{new Date(cycle.inspection.completedAt).toLocaleString()}</dd></div>
        <div><dt>Post-trip completed</dt><dd>{new Date(post.completedAt).toLocaleString()}</dd></div>
        {mileageRows}
        <div><dt>Unfinished stops acknowledged</dt><dd>{post.unfinishedStops}</dd></div>
      </dl>
      <details className="order-detail-card inspection-photo-record"><summary>View linked Pre-trip record</summary>
        <p>Inspected by {cycle.inspection.inspectedBy ?? 'Not recorded'} · {formatInspectionMiles(startOdometer)}</p>
        {Object.entries(cycle.inspection.answers).map(([id, answer]) => <p key={id}>{legacyPreTripChecks.find((item) => item.id === id)?.label}: {answer}</p>)}
        <InspectionPhotoRecord photos={cycle.inspection.photos} />
      </details>
      {recordedChecks.length ? <div className="pretrip-checklist">{recordedChecks.map((item) => <section key={item.id} className={post.answers[item.id] === 'issue' ? 'has-issue' : 'has-passed'}><div><strong>{item.label}</strong><small>{post.answers[item.id] === 'issue' ? post.issues[item.id]?.trim() || 'Issue reported' : 'Pass'}</small></div></section>)}</div> : null}
      <InspectionPhotoRecord photos={post.photos} />
      <p className="posttrip-record-note">Driver confirmed the record is accurate. This completed record is read-only.</p>
      <Link className="ebol-secondary" to="/">Back to Home</Link>
    </main>
  </div>

  const documents = readOrderEbols()
  const unfinishedStops = spokeRoute?.tasks.filter((task) => {
    const document = documents.find((item) => item.orderNumber === task.externalId)
    return !(task.operation === 'pickup' ? document?.pickup.lockedAt : document?.delivery.lockedAt)
  }).length ?? 0

  return <div className="cargo-flow pretrip-flow">{header}
    {store.saveError ? <p className="ebol-storage-warning" role="alert">Inspection could not be saved. Check device storage and retry.</p> : null}
    <InspectionCaptureForm photos={post.photos} odometer={post.odometer} startOdometer={startOdometer}
      capturePhoto={(id) => store.updatePostTrip({ photos: [...new Set([...post.photos, id])] })}
      setOdometer={(odometer) => store.updatePostTrip({ odometer })}
      canComplete={postTripCanComplete(post, startOdometer) && (unfinishedStops === 0 || acknowledged)}
      completeLabel="Complete Post-trip" onComplete={() => { if (store.completePostTrip(unfinishedStops, acknowledged)) window.scrollTo(0, 0) }}>
      <div className="pretrip-review-state"><span><Check size={28} /></span><h1>Review Post-trip</h1><p>Confirm the vehicle condition and equipment record.</p></div>
      <dl className="pretrip-review-list">
        <div><dt>Vehicle</dt><dd>{cycle.vehicle}</dd></div>
        <div><dt>Inspected by</dt><dd>{inspectionDriver}</dd></div>
        {mileageRows}
        <div><dt>Required photos</dt><dd>{post.photos.length}/{postTripPhotos.length} captured</dd></div>
      </dl>
      <InspectionPhotoRecord photos={post.photos} />
      {unfinishedStops > 0 ? <label className="pretrip-attestation"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span><strong>{unfinishedStops} stops have no completed handoff</strong><small>I acknowledge these stops remain unfinished and must be reported to dispatch. Orders will not be closed by this inspection.</small></span></label> : null}
      <label className="pretrip-attestation"><input type="checkbox" checked={post.attested} onChange={(event) => store.updatePostTrip({ attested: event.target.checked })} /><span><strong>I confirm this inspection record is accurate</strong><small>This inspection will be recorded under {inspectionDriver}.</small></span></label>
    </InspectionCaptureForm>
  </div>
}
