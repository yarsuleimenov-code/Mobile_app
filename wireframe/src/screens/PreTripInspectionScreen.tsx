import { AlertTriangle, Check, CheckCircle2, ChevronRight, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CargoFlowHeader } from '../cargo-components'
import { InspectionCaptureForm, InspectionPhotoRecord } from '../InspectionCaptureForm'
import { formatInspectionMiles, inspectionCanComplete, preTripPhotos } from '../preTripInspectionDomain'
import { currentUser } from '../currentUser'
import { usePreTripInspection } from '../preTripInspectionStore'

export function PreTripInspectionScreen() {
  const navigate = useNavigate()
  const { inspection, history, postTrip, vehicle, saveError, capturePhoto, setOdometer, setAttested, completeInspection } = usePreTripInspection()
  const header = <CargoFlowHeader title="Pre-trip inspection" subtitle={vehicle} />

  if (inspection.completedAt) {
    return <div className="cargo-flow pretrip-flow">
      {header}
      <main className="pretrip-complete">
        <span><Check size={38} /></span>
        <p className="pretrip-eyebrow">{postTrip.completedAt ? 'PRE-TRIP RECORD' : 'READY FOR ROUTE'}</p>
        <h1>{postTrip.completedAt ? 'Pre-trip completed' : 'Vehicle cleared'}</h1>
        <p>{postTrip.completedAt ? 'Start the next cycle from Home to record a new Pre-trip.' : 'Today’s route is now available.'}</p>
        <p>Completed {new Date(inspection.completedAt).toLocaleString()} · Read-only</p>
        <div className="pretrip-vehicle-summary"><Truck size={25} /><span><strong>{vehicle}</strong><small>{inspection.inspectedBy ?? 'Driver not recorded'} · {formatInspectionMiles(inspection.odometer)}</small></span><CheckCircle2 size={22} /></div>
        <InspectionPhotoRecord photos={inspection.photos} />
        <button type="button" className="cargo-primary" onClick={() => navigate('/')}>Back to Home <ChevronRight size={19} /></button>
      </main>
    </div>
  }

  return <div className="cargo-flow pretrip-flow">
    {header}
    {saveError ? <p className="ebol-storage-warning" role="alert">Inspection could not be saved. Check device storage and retry.</p> : null}
    {Object.values(history.at(-1)?.postTrip.answers ?? {}).includes('issue') ? <div className="pretrip-warning"><AlertTriangle size={20} /><span><strong>Previous Post-trip reported issues</strong><small>Report to dispatch and verify the vehicle has been reviewed before departure.</small></span></div> : null}
    <InspectionCaptureForm photos={inspection.photos} odometer={inspection.odometer} capturePhoto={capturePhoto} setOdometer={setOdometer}
      canComplete={inspectionCanComplete(inspection)} completeLabel="Complete inspection" onComplete={() => { if (completeInspection()) window.scrollTo(0, 0) }}>
      <div className="pretrip-review-state"><span><CheckCircle2 size={28} /></span><h1>Review Pre-trip</h1><p>Review the vehicle and equipment record before departure.</p></div>
      <dl className="pretrip-review-list">
        <div><dt>Vehicle</dt><dd>{vehicle}</dd></div>
        <div><dt>Inspected by</dt><dd>{currentUser.name}</dd></div>
        <div><dt>Odometer</dt><dd>{formatInspectionMiles(inspection.odometer)}</dd></div>
        <div><dt>Required photos</dt><dd>{inspection.photos.length}/{preTripPhotos.length} captured</dd></div>
      </dl>
      <InspectionPhotoRecord photos={inspection.photos} />
      <label className="pretrip-attestation"><input type="checkbox" checked={inspection.attested} onChange={(event) => setAttested(event.target.checked)} />
        <span><strong>I confirm this vehicle is safe to operate</strong><small>This inspection will be recorded under {currentUser.name}.</small></span></label>
    </InspectionCaptureForm>
  </div>
}
