import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoFlowHeader } from '../cargo-components'
import {
  inspectionChecklistComplete,
  inspectionHasIssue,
  inspectionPhotosComplete,
  preTripChecks,
  preTripPhotos,
} from '../preTripInspectionDomain'
import { usePreTripInspection } from '../preTripInspectionStore'
import { usePrototypeScenario } from '../prototypeScenarioStore'

type InspectionStep = 'checklist' | 'photos' | 'review'

const steps: Array<{ id: InspectionStep; label: string }> = [
  { id: 'checklist', label: 'Check' },
  { id: 'photos', label: 'Photos' },
  { id: 'review', label: 'Review' },
]

export function PreTripInspectionScreen() {
  const navigate = useNavigate()
  const { devices } = usePrototypeScenario()
  const { inspection, answerCheck, capturePhoto, setAttested, completeInspection } = usePreTripInspection()
  const [step, setStep] = useState<InspectionStep>(() => {
    if (inspectionPhotosComplete(inspection)) return 'review'
    if (inspectionChecklistComplete(inspection)) return 'photos'
    return 'checklist'
  })
  const [completed, setCompleted] = useState(false)
  const currentIndex = steps.findIndex((item) => item.id === step)
  const issueCount = useMemo(() => Object.values(inspection.answers).filter((answer) => answer === 'issue').length, [inspection.answers])

  const finish = () => {
    if (!completeInspection()) return
    setCompleted(true)
  }

  if (completed) {
    return (
      <div className="cargo-flow pretrip-flow">
        <CargoFlowHeader title="Pre-trip inspection" subtitle="Van 08 · Extended Van" />
        <main className="pretrip-complete">
          <span><Check size={38} /></span>
          <p className="pretrip-eyebrow">READY FOR ROUTE</p>
          <h1>Vehicle cleared</h1>
          <p>Safety checks and required photos are complete. Today’s route is now available.</p>
          <div className="pretrip-vehicle-summary"><Truck size={25} /><span><strong>Van 08 · Extended Van</strong><small>NJ1 · Today’s route</small></span><CheckCircle2 size={22} /></div>
          <button type="button" className="cargo-primary" onClick={() => navigate('/')}>Open today’s route <ChevronRight size={19} /></button>
        </main>
      </div>
    )
  }

  return (
    <div className="cargo-flow pretrip-flow">
      <CargoFlowHeader title="Pre-trip inspection" subtitle="Van 08 · Extended Van" />
      <div className="pretrip-progress" aria-label={`Step ${currentIndex + 1} of ${steps.length}`}>
        {steps.map((item, index) => <div key={item.id} className={index < currentIndex ? 'is-done' : index === currentIndex ? 'is-active' : ''}><span>{index < currentIndex ? <Check size={15} /> : index + 1}</span><small>{item.label}</small></div>)}
      </div>

      {step === 'checklist' ? (
        <main className="pretrip-body">
          <div className="pretrip-intro"><span><ShieldCheck size={24} /></span><div><h1>Confirm the vehicle is safe</h1><p>Inspect each item before you start the route. Report anything that needs attention.</p></div></div>
          <div className="pretrip-checklist">
            {preTripChecks.map((item) => {
              const answer = inspection.answers[item.id]
              return <section key={item.id} className={answer === 'issue' ? 'has-issue' : answer === 'pass' ? 'has-passed' : ''}>
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
                <div className="pretrip-answer">
                  <button type="button" className={answer === 'pass' ? 'is-selected' : ''} aria-pressed={answer === 'pass'} onClick={() => answerCheck(item.id, 'pass')}><Check size={16} /> Pass</button>
                  <button type="button" className={answer === 'issue' ? 'is-selected' : ''} aria-pressed={answer === 'issue'} onClick={() => answerCheck(item.id, 'issue')}><AlertTriangle size={16} /> Issue</button>
                </div>
              </section>
            })}
          </div>
          {issueCount ? <div className="pretrip-warning"><CircleAlert size={20} /><span><strong>{issueCount} issue{issueCount === 1 ? '' : 's'} reported</strong><small>The route will remain locked until all safety items pass.</small></span></div> : null}
          <div className="pretrip-sticky"><button type="button" className="cargo-primary" disabled={!inspectionChecklistComplete(inspection)} onClick={() => setStep('photos')}>Continue to photos <ChevronRight size={19} /></button></div>
        </main>
      ) : null}

      {step === 'photos' ? (
        <main className="pretrip-body">
          <div className="pretrip-intro"><span><Camera size={24} /></span><div><h1>Photograph all four sides</h1><p>Stand far enough away to keep the full vehicle and wheels in frame.</p></div></div>
          {!devices.camera ? <div className="pretrip-warning"><CircleAlert size={20} /><span><strong>Camera unavailable</strong><small>Camera access is required to complete the inspection.</small></span></div> : null}
          <div className="pretrip-photo-grid">
            {preTripPhotos.map((photo) => {
              const captured = inspection.photos.includes(photo.id)
              return <button type="button" key={photo.id} className={captured ? 'is-captured' : ''} disabled={!devices.camera} onClick={() => capturePhoto(photo.id)}>
                <span className="pretrip-photo-visual">{captured ? <><Truck size={34} /><b><Check size={15} /></b></> : <Camera size={27} />}</span>
                <strong>{photo.label}</strong><small>{captured ? 'Captured just now · Tap to retake' : photo.detail}</small>
              </button>
            })}
          </div>
          <p className="pretrip-camera-note"><Camera size={15} /> Photos must be taken now. Gallery upload is not available.</p>
          <div className="pretrip-sticky pretrip-sticky--split"><button type="button" className="pretrip-back" onClick={() => setStep('checklist')}>Back</button><button type="button" className="cargo-primary" disabled={!inspectionPhotosComplete(inspection)} onClick={() => setStep('review')}>Review inspection <ChevronRight size={19} /></button></div>
        </main>
      ) : null}

      {step === 'review' ? (
        <main className="pretrip-body">
          <div className={`pretrip-review-state ${inspectionHasIssue(inspection) ? 'is-blocked' : ''}`}>
            <span>{inspectionHasIssue(inspection) ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}</span>
            <p className="pretrip-eyebrow">{inspectionHasIssue(inspection) ? 'ROUTE LOCKED' : 'READY TO SUBMIT'}</p>
            <h1>{inspectionHasIssue(inspection) ? 'Vehicle needs attention' : 'Inspection complete'}</h1>
            <p>{inspectionHasIssue(inspection) ? 'Return to the checklist and clear reported issues after the vehicle has been reviewed.' : 'Review the record and confirm the vehicle is safe to operate.'}</p>
          </div>
          <dl className="pretrip-review-list">
            <div><dt>Vehicle</dt><dd>Van 08 · Extended Van</dd></div>
            <div><dt>Safety checklist</dt><dd className={issueCount ? 'is-issue' : ''}>{issueCount ? `${issueCount} issue${issueCount === 1 ? '' : 's'}` : `${preTripChecks.length}/${preTripChecks.length} passed`}</dd></div>
            <div><dt>Required photos</dt><dd>{inspection.photos.length}/{preTripPhotos.length} captured</dd></div>
            <div><dt>Branch</dt><dd>NJ1</dd></div>
          </dl>
          {!inspectionHasIssue(inspection) ? <label className="pretrip-attestation"><input type="checkbox" checked={inspection.attested} onChange={(event) => setAttested(event.target.checked)} /><span><strong>I confirm this vehicle is safe to operate</strong><small>This inspection will be recorded under the signed-in driver.</small></span></label> : null}
          <div className="pretrip-sticky pretrip-sticky--split"><button type="button" className="pretrip-back" onClick={() => setStep(inspectionHasIssue(inspection) ? 'checklist' : 'photos')}>{inspectionHasIssue(inspection) ? 'Review issues' : 'Back'}</button><button type="button" className="cargo-primary" disabled={inspectionHasIssue(inspection) || !inspection.attested} onClick={finish}>Complete inspection <Check size={19} /></button></div>
        </main>
      ) : null}
    </div>
  )
}
