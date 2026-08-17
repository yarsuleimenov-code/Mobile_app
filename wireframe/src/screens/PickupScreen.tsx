import { Camera, Check, ChevronRight, CirclePlus, Package, ScanLine } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FlowHeader, ScanButton, SyncNotice } from '../components'
import { useDemo } from '../store'

type Step = 'places' | 'photos' | 'review' | 'complete'
const steps: { id: Step; label: string; icon: typeof Package }[] = [
  { id: 'places', label: 'Places', icon: Package },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'review', label: 'Review', icon: ScanLine },
  { id: 'complete', label: 'Complete', icon: Check },
]

export function PickupScreen() {
  const [step, setStep] = useState<Step>('places')
  const { places, togglePlace, addPlace, pickupPhotos, addPickupPhoto, network } = useDemo()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const completeCount = places.filter((place) => place.complete).length
  const stepIndex = steps.findIndex((item) => item.id === step)

  const next = () => setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].id)

  return (
    <div className="flow-screen">
      <FlowHeader title="Pickup" subtitle={taskId === 'start' ? 'Choose an order' : '#12345678 · 100 Market St, Newark'} onBack={() => stepIndex ? setStep(steps[stepIndex - 1].id) : navigate('/')} />
      <div className="flow-progress">
        {steps.map(({ id, label, icon: Icon }, index) => <div key={id} className={`${index <= stepIndex ? 'is-active' : ''} ${index < stepIndex ? 'is-done' : ''}`}><span><Icon size={19} /></span><small>{label}</small></div>)}
      </div>

      {step === 'places' ? (
        <div className="flow-body">
          <div className="flow-summary"><div><strong>{places.length} places</strong><span>{completeCount} ready · {places.length - completeCount} need details</span></div><span className="summary-total">95 lb</span></div>
          <div className="place-list">
            {places.map((place) => (
              <button key={place.id} className="place-row" onClick={() => togglePlace(place.id)}>
                <span className={`place-state ${place.complete ? 'is-complete' : ''}`}>{place.complete ? <Check size={17} /> : <span />}</span>
                <span className="place-main"><strong>{place.label}</strong><span>{place.dimensions}{place.weight ? ` · ${place.weight} lb` : ''}</span><small>{place.items} {place.items === 1 ? 'item' : 'items'} · {place.id}</small></span>
                <span className={place.complete ? 'status-complete' : 'status-incomplete'}>{place.complete ? 'Complete' : 'Incomplete'}</span>
                <ChevronRight size={20} />
              </button>
            ))}
            <button className="add-row" onClick={addPlace}><span><CirclePlus size={25} /></span><strong>Add place</strong></button>
          </div>
          <ScanButton label="Scan or test a label" />
          <SyncNotice />
        </div>
      ) : null}

      {step === 'photos' ? (
        <div className="flow-body photo-step">
          <div className="flow-summary"><div><strong>Photo checklist</strong><span>Document item, packing and condition</span></div><span className="summary-total">{pickupPhotos}/4</span></div>
          <div className="photo-grid">
            {Array.from({ length: pickupPhotos }).map((_, index) => <div className="photo-tile is-filled" key={index}><Camera size={23} /><span>{index < 2 ? 'Item' : 'Packing'} {index + 1}</span><small>Saved on device</small></div>)}
            <button className="photo-tile" onClick={addPickupPhoto}><CirclePlus size={25} /><span>Add photo</span><small>Camera simulation</small></button>
          </div>
          <div className="damage-question"><div><strong>Any damage?</strong><span>Add evidence before completing pickup.</span></div><div><button>No damage</button><button className="outline-alert">Report damage</button></div></div>
          <SyncNotice />
        </div>
      ) : null}

      {step === 'review' ? (
        <div className="flow-body review-step">
          <div className="review-hero"><span><Check size={26} /></span><h2>Pickup ready to complete</h2><p>Review actual cargo before confirming.</p></div>
          <dl className="review-list"><div><dt>Order</dt><dd>#12345678</dd></div><div><dt>Movement</dt><dd>Same Day · NJ1 → NJ1</dd></div><div><dt>Places</dt><dd>{places.length} · {completeCount} complete</dd></div><div><dt>Weight</dt><dd>95 lb measured</dd></div><div><dt>Photos</dt><dd>{pickupPhotos} captured</dd></div><div><dt>Sync</dt><dd>{network === 'online' ? 'Ready' : 'Will complete when online'}</dd></div></dl>
          <button className="text-action">Save as partial pickup</button>
        </div>
      ) : null}

      {step === 'complete' ? (
        <div className="flow-body completion-step"><span className="completion-icon"><Check size={38} /></span><h2>Pickup completed</h2><p>{network === 'online' ? 'Central record confirmed.' : 'Saved on device. Final confirmation is waiting for connection.'}</p><div className="completion-route"><strong>Same Day route</strong><span>Next: Dropoff #12345681 · 2:30 PM</span></div><button className="button button--primary" onClick={() => navigate('/routes/SD-2408')}>Continue route</button><button className="button button--ghost" onClick={() => navigate('/')}>Back to Home</button></div>
      ) : null}

      {step !== 'complete' ? <div className="sticky-action"><button className="button button--primary" onClick={next}>{step === 'review' ? 'Complete Pickup' : step === 'photos' ? 'Review Pickup' : 'Continue to photos'}<ChevronRight size={20} /></button></div> : null}
    </div>
  )
}
