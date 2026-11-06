import { AlertTriangle, Camera, Check, ChevronRight, Truck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { equipmentInspectionPhotos, isOdometerReading, legacyPreTripPhotos, preTripPhotos, type PreTripPhotoId } from './preTripInspectionDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'

const steps = ['Vehicle', 'Equipment', 'Review'] as const
type InspectionStep = typeof steps[number]

export function InspectionPhotoRecord({ photos }: { photos: PreTripPhotoId[] }) {
  return <details className="order-detail-card inspection-photo-record">
    <summary>Captured photos ({photos.length})</summary>
    <ul>{preTripPhotos.filter(({ id }) => photos.includes(id)).map((photo) =>
      <li key={photo.id}><Check size={16} aria-hidden="true" />{photo.label}</li>)}</ul>
  </details>
}

export function InspectionCaptureForm({ photos, odometer, startOdometer, setOdometer, capturePhoto, canComplete, onComplete, completeLabel, children }: {
  photos: PreTripPhotoId[]
  odometer?: number
  startOdometer?: number
  setOdometer: (value: number | undefined) => void
  capturePhoto: (id: PreTripPhotoId) => void
  canComplete: boolean
  onComplete: () => void
  completeLabel: string
  children: ReactNode
}) {
  const { devices } = usePrototypeScenario()
  const belowStart = odometer !== undefined && startOdometer !== undefined && odometer < startOdometer
  const vehicleReady = legacyPreTripPhotos.every(({ id }) => photos.includes(id))
    && isOdometerReading(odometer) && !belowStart
  const equipmentReady = equipmentInspectionPhotos.every(({ id }) => photos.includes(id))
  const [step, setStep] = useState<InspectionStep>(() => !vehicleReady ? 'Vehicle' : equipmentReady ? 'Review' : 'Equipment')
  const currentIndex = steps.indexOf(step)
  const goTo = (next: InspectionStep) => { setStep(next); window.scrollTo(0, 0) }
  const photoGroup = step === 'Vehicle' ? legacyPreTripPhotos : equipmentInspectionPhotos

  return <>
    <div className="pretrip-progress" aria-label={`Step ${currentIndex + 1} of 3`}>
      {steps.map((item, index) => <div key={item} className={index < currentIndex ? 'is-done' : index === currentIndex ? 'is-active' : ''}>
        <span>{index < currentIndex ? <Check size={15} aria-hidden="true" /> : index + 1}</span><small>{item}</small>
      </div>)}
    </div>
    <main className="pretrip-body">
      {step === 'Review' ? <>
        {children}
        <div className="pretrip-sticky pretrip-sticky--split">
          <button type="button" className="pretrip-back" onClick={() => goTo('Equipment')}>Back</button>
          <button type="button" className="cargo-primary" disabled={!canComplete} onClick={onComplete}>{completeLabel} <Check size={19} aria-hidden="true" /></button>
        </div>
      </> : <>
        <div className="pretrip-intro">
          <span>{step === 'Vehicle' ? <Truck size={24} aria-hidden="true" /> : <Camera size={24} aria-hidden="true" />}</span>
          <div><h1>{step === 'Vehicle' ? 'Vehicle photos and odometer' : 'Equipment photos'}</h1>
            <p>{step === 'Vehicle' ? 'Capture all four sides of the vehicle and its dashboard.' : 'Capture each required item in the vehicle.'}</p>
          </div>
        </div>
        {!devices.camera ? <div className="pretrip-warning" role="alert"><AlertTriangle size={20} /><span><strong>Camera unavailable</strong><small>Restore camera access to capture the required photos.</small></span></div> : null}
        <div className="pretrip-photo-grid" aria-label={`${step} photos`}>
          {photoGroup.map((photo) => {
            const captured = photos.includes(photo.id)
            return <button type="button" key={photo.id} className={captured ? 'is-captured' : ''} disabled={!devices.camera}
              aria-label={`${captured ? 'Retake' : 'Take photo of'} ${photo.label}`} onClick={() => capturePhoto(photo.id)}>
              <span className="pretrip-photo-visual">{captured ? <Check size={28} aria-hidden="true" /> : <Camera size={27} aria-hidden="true" />}</span>
              <strong>{photo.label}</strong>
              {captured ? <small>Captured · Tap to retake</small> : 'detail' in photo ? <small>{photo.detail}</small> : null}
            </button>
          })}
        </div>
        {step === 'Vehicle' ? <>
          <label className="ebol-field">Odometer (mi)<input inputMode="numeric" value={odometer ?? ''} placeholder="Enter whole miles"
            aria-invalid={belowStart || undefined} onChange={(event) => {
              const value = event.target.value
              if (value === '') setOdometer(undefined)
              else if (/^\d+$/.test(value) && isOdometerReading(Number(value))) setOdometer(Number(value))
            }} /></label>
          {belowStart ? <p className="measurement-warning" role="alert">Ending odometer must be at least the Pre-trip reading.</p> : null}
          <div className="pretrip-sticky"><button type="button" className="cargo-primary" disabled={!vehicleReady} onClick={() => goTo('Equipment')}>Continue to equipment <ChevronRight size={19} aria-hidden="true" /></button></div>
        </> : <div className="pretrip-sticky pretrip-sticky--split">
          <button type="button" className="pretrip-back" onClick={() => goTo('Vehicle')}>Back</button>
          <button type="button" className="cargo-primary" disabled={!vehicleReady || !equipmentReady} onClick={() => goTo('Review')}>Review inspection <ChevronRight size={19} aria-hidden="true" /></button>
        </div>}
      </>}
    </main>
  </>
}
