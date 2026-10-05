import { AlertTriangle, Camera, Check, ChevronRight, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CargoFlowHeader } from '../cargo-components'
import { useCargo } from '../cargoStore'
import { readOrderEbols } from '../orderEbolStore'
import { postTripCanComplete, postTripChecklistComplete, postTripChecks, postTripIssues, postTripPhotos } from '../postTripInspectionDomain'
import { usePreTripInspection } from '../preTripInspectionStore'
import { usePrototypeScenario } from '../prototypeScenarioStore'

export function PostTripInspectionScreen() {
  const store = usePreTripInspection()
  const [params] = useSearchParams()
  const archived = params.has('cycle') ? store.history[Number(params.get('cycle'))] : undefined
  const cycle = archived ?? store
  const post = cycle.postTrip
  const [step, setStep] = useState<'checklist' | 'photos' | 'review'>(() => postTripChecklistComplete(post) ? postTripPhotos.every((item) => post.photos.includes(item.id)) ? 'review' : 'photos' : 'checklist')
  const [acknowledged, setAcknowledged] = useState(false)
  const { spokeRoute } = useCargo()
  const { devices } = usePrototypeScenario()
  const documents = readOrderEbols()
  const unfinishedStops = spokeRoute?.tasks.filter((task) => {
    const document = documents.find((item) => item.orderNumber === task.externalId)
    return !(task.operation === 'pickup' ? document?.pickup.lockedAt : document?.delivery.lockedAt)
  }).length ?? 0
  const issues = postTripIssues(post)
  const locked = Boolean(post.completedAt || archived)
  const photosComplete = postTripPhotos.every((item) => post.photos.includes(item.id))
  const header = <CargoFlowHeader title="Post-trip inspection" subtitle={cycle.vehicle} />

  if ((params.has('cycle') && !archived) || !cycle.inspection.completedAt) return <div className="cargo-flow pretrip-flow">{header}<main className="pretrip-body"><h1>{params.has('cycle') ? 'Inspection not found' : 'Pre-trip inspection required'}</h1><p>Complete the vehicle’s Pre-trip before recording its Post-trip.</p><Link className="ebol-secondary" to="/">Back to Home</Link></main></div>

  return <div className="cargo-flow pretrip-flow">{header}
    {!locked ? <div className="pretrip-progress" aria-label={`Step ${['checklist', 'photos', 'review'].indexOf(step) + 1} of 3`}>{(['checklist', 'photos', 'review'] as const).map((id, index) => <div key={id} className={step === id ? 'is-active' : ''}><span>{index + 1}</span><small>{id === 'checklist' ? 'Check' : id === 'photos' ? 'Photos' : 'Review'}</small></div>)}</div> : null}
    <main className="pretrip-body">
      {store.saveError ? <p className="ebol-storage-warning" role="alert">Inspection could not be saved. Check device storage and retry. Your last saved record has not changed.</p> : null}
      {locked ? <>
        <div className={`pretrip-review-state ${issues.length ? 'is-blocked' : ''}`}><span>{issues.length ? <AlertTriangle size={28} /> : <Check size={28} />}</span><p className="pretrip-eyebrow">POST-TRIP RECORDED</p><h1>{issues.length ? 'Completed — issues reported' : 'Post-trip completed'}</h1><p>{issues.length ? 'Vehicle needs attention. Report the recorded issues to dispatch before the next departure.' : 'Vehicle condition and equipment have been recorded.'}</p></div>
        <dl className="pretrip-review-list"><div><dt>Vehicle</dt><dd>{cycle.vehicle}</dd></div><div><dt>Pre-trip completed</dt><dd>{new Date(cycle.inspection.completedAt).toLocaleString()}</dd></div><div><dt>Post-trip completed</dt><dd>{new Date(post.completedAt!).toLocaleString()}</dd></div><div><dt>Required photos</dt><dd>{post.photos.length}/{postTripPhotos.length}</dd></div><div><dt>Unfinished stops acknowledged</dt><dd>{post.unfinishedStops}</dd></div></dl>
        <details className="order-detail-card"><summary>View linked Pre-trip record</summary><p>Completed {new Date(cycle.inspection.completedAt).toLocaleString()}</p>{Object.entries(cycle.inspection.answers).map(([id, answer]) => <p key={id}>{postTripChecks.find((item) => item.id === id)?.label}: {answer}</p>)}<p>Photos: {cycle.inspection.photos.join(', ')}</p></details>
        <div className="pretrip-checklist">{postTripChecks.map((item) => <section key={item.id} className={post.answers[item.id] === 'issue' ? 'has-issue' : 'has-passed'}><div><strong>{item.label}</strong><small>{post.answers[item.id] === 'issue' ? `Issue: ${post.issues[item.id]}` : 'Pass'}</small></div></section>)}</div>
        <div className="pretrip-photo-grid">{postTripPhotos.map((photo) => <div className="posttrip-record-note" key={photo.id}><Check size={16} /> {photo.label} · Captured</div>)}</div><p className="posttrip-record-note">Driver confirmed the record is accurate. This completed record is read-only.</p>
        <Link className="ebol-secondary" to="/">Back to Home</Link>
      </> : null}
      {!locked && step === 'checklist' ? <>
        <div className="pretrip-intro"><span><Truck size={24} /></span><div><h1>Record the vehicle’s condition</h1><p>Check the vehicle after use. Report defects and missing equipment; issues do not prevent submission.</p></div></div>
        <div className="pretrip-checklist">{postTripChecks.map((item) => <section key={item.id} className={post.answers[item.id] === 'issue' ? 'has-issue' : post.answers[item.id] === 'pass' ? 'has-passed' : ''}>
          <div><strong>{item.label}</strong><small>{item.detail}</small></div>
          <div className="pretrip-answer">{(['pass', 'issue'] as const).map((answer) => <button type="button" key={answer} aria-pressed={post.answers[item.id] === answer} className={post.answers[item.id] === answer ? 'is-selected' : ''} onClick={() => store.updatePostTrip({ answers: { ...post.answers, [item.id]: answer } })}>{answer === 'pass' ? <Check size={16} /> : <AlertTriangle size={16} />}{answer === 'pass' ? 'Pass' : 'Issue'}</button>)}</div>
          {post.answers[item.id] === 'issue' ? <label className="ebol-field posttrip-issue">Describe the issue — {item.label}<textarea maxLength={1000} rows={3} value={post.issues[item.id] ?? ''} onChange={(event) => store.updatePostTrip({ issues: { ...post.issues, [item.id]: event.target.value } })} placeholder="What needs attention?" required /></label> : null}
        </section>)}</div>
        <div className="pretrip-sticky"><button type="button" className="cargo-primary" disabled={!postTripChecklistComplete(post)} onClick={() => setStep('photos')}>Continue to photos <ChevronRight size={19} /></button></div>
      </> : null}
      {!locked && step === 'photos' ? <>
        <div className="pretrip-intro"><span><Camera size={24} /></span><div><h1>Record five required photos</h1><p>Capture all four sides and the dashboard, including any warning indicators.</p></div></div>
        {!devices.camera ? <div className="pretrip-warning" role="alert"><AlertTriangle size={20} /><span><strong>Camera unavailable</strong><small>Restore camera access to complete the inspection.</small></span></div> : null}
        <div className="pretrip-photo-grid">{postTripPhotos.map((photo) => <button type="button" key={photo.id} disabled={!devices.camera} className={post.photos.includes(photo.id) ? 'is-captured' : ''} onClick={() => store.updatePostTrip({ photos: [...new Set([...post.photos, photo.id])] })}><span className="pretrip-photo-visual">{post.photos.includes(photo.id) ? <Check size={28} /> : <Camera size={28} />}</span><strong>{photo.label}</strong><small>{post.photos.includes(photo.id) ? 'Captured · Tap to retake' : photo.detail}</small></button>)}</div>
        <p className="pretrip-camera-note">Photos must be taken now. Gallery upload is not available.</p>
        <div className="pretrip-sticky pretrip-sticky--split"><button type="button" className="pretrip-back" onClick={() => setStep('checklist')}>Back</button><button type="button" className="cargo-primary" disabled={!photosComplete} onClick={() => setStep('review')}>Review inspection</button></div>
      </> : null}
      {!locked && step === 'review' ? <>
        <div className="pretrip-review-state"><h1>Review Post-trip</h1><p>{issues.length ? 'Issues will be recorded. This does not confirm the vehicle is safe for its next departure.' : 'Confirm the vehicle condition and equipment record.'}</p></div>
        <dl className="pretrip-review-list"><div><dt>Vehicle</dt><dd>{cycle.vehicle}</dd></div><div><dt>Checklist</dt><dd>{postTripChecklistComplete(post) ? `${postTripChecks.length}/${postTripChecks.length} checked` : 'Incomplete'}</dd></div><div><dt>Photos</dt><dd>{post.photos.length}/{postTripPhotos.length}</dd></div></dl>
        {issues.map((item) => <div className="pretrip-warning" key={item.id}><AlertTriangle size={20} /><span><strong>{item.label}</strong><small>{post.issues[item.id]}</small></span></div>)}
        {unfinishedStops > 0 ? <label className="pretrip-attestation"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span><strong>{unfinishedStops} stops have no completed handoff</strong><small>I acknowledge these stops remain unfinished and must be reported to dispatch. Orders will not be closed by this inspection.</small></span></label> : null}
        <label className="pretrip-attestation"><input type="checkbox" checked={post.attested} onChange={(event) => store.updatePostTrip({ attested: event.target.checked })} /><span><strong>I confirm this inspection record is accurate</strong><small>Vehicle condition, photos and reported issues will be recorded.</small></span></label>
        <div className="pretrip-sticky pretrip-sticky--split"><button type="button" className="pretrip-back" onClick={() => setStep('checklist')}>Review checks</button><button type="button" className="cargo-primary" disabled={!postTripCanComplete(post) || (unfinishedStops > 0 && !acknowledged)} onClick={() => store.completePostTrip(unfinishedStops, acknowledged)}>Complete Post-trip <Check size={19} /></button></div>
      </> : null}
    </main>
  </div>
}
