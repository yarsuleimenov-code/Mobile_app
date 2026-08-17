import { Camera, Check, ChevronRight, CircleAlert, ScanLine, Signature } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlowHeader, SyncNotice } from '../components'
import { dropoffPlaces } from '../data'
import { useDemo } from '../store'

type Step = 'scan' | 'evidence' | 'recipient' | 'review' | 'complete'

export function DropoffScreen() {
  const [step, setStep] = useState<Step>('scan')
  const [photoCount, setPhotoCount] = useState(1)
  const { dropoffScanned, scanDropoff, network } = useDemo()
  const navigate = useNavigate()
  const scanned = new Set(dropoffScanned)
  const remaining = dropoffPlaces.filter((place) => !scanned.has(place.id))
  const simulateScan = () => { const next = remaining[0]; if (next) scanDropoff(next.id) }

  return (
    <div className="flow-screen dropoff-flow">
      <FlowHeader title="Dropoff" subtitle="#12345679 · 50 Park Ave, Edison" onBack={() => navigate('/')} />
      <div className="dropoff-meter"><div><strong>{dropoffScanned.length} of {dropoffPlaces.length}</strong><span>places delivered</span></div><div className="meter"><span style={{ width: `${(dropoffScanned.length / dropoffPlaces.length) * 100}%` }} /></div></div>

      {step === 'scan' ? <div className="flow-body">
        <div className="scan-loop"><ScanLine size={38} /><h2>Scan delivered places</h2><p>Each scan is checked against the expected pickup record.</p><button className="button button--primary" onClick={simulateScan}>{remaining.length ? 'Simulate next scan' : 'All places scanned'}</button></div>
        <div className="place-list compact">
          {dropoffPlaces.map((place) => <div key={place.id} className="place-row"><span className={`place-state ${scanned.has(place.id) ? 'is-complete' : ''}`}>{scanned.has(place.id) ? <Check size={17} /> : <span />}</span><span className="place-main"><strong>{place.label}</strong><span>{place.dimensions} · {place.weight} lb</span><small>{place.id}</small></span><span className={scanned.has(place.id) ? 'status-complete' : 'status-muted'}>{scanned.has(place.id) ? 'Received' : 'Expected'}</span></div>)}
        </div>
        <button className="issue-action"><CircleAlert size={20} /> Report missing, damage or refusal</button>
        <SyncNotice />
      </div> : null}

      {step === 'evidence' ? <div className="flow-body photo-step"><div className="flow-summary"><div><strong>Delivery evidence</strong><span>Capture final condition and handoff.</span></div><span className="summary-total">{photoCount}/2</span></div><div className="photo-grid">{Array.from({ length: photoCount }).map((_, index) => <div className="photo-tile is-filled" key={index}><Camera size={23} /><span>Delivery {index + 1}</span><small>Saved</small></div>)}<button className="photo-tile" onClick={() => setPhotoCount((count) => count + 1)}><Camera size={25} /><span>Add photo</span></button></div><div className="known-condition"><Check size={20} /><div><strong>No new damage reported</strong><span>Pickup condition photos remain available for comparison.</span></div></div></div> : null}

      {step === 'recipient' ? <div className="flow-body recipient-step"><div className="recipient-icon"><Signature size={30} /></div><h2>Recipient confirmation</h2><label>Recipient name<input defaultValue="Morgan Lee" /></label><label>Confirmation method<select defaultValue="signature"><option value="signature">Signature</option><option value="photo">Photo confirmation</option><option value="refused">Recipient refused</option></select></label><div className="signature-box">Morgan Lee</div><p>Signature shown for prototype evaluation only.</p></div> : null}

      {step === 'review' ? <div className="flow-body review-step"><div className="review-hero"><span><Check size={26} /></span><h2>Dropoff ready</h2><p>All expected places are accounted for.</p></div><dl className="review-list"><div><dt>Delivered</dt><dd>{dropoffScanned.length}/{dropoffPlaces.length} places</dd></div><div><dt>Movement</dt><dd>Local standard · NJ1</dd></div><div><dt>Recipient</dt><dd>Morgan Lee</dd></div><div><dt>Photos</dt><dd>{photoCount} captured</dd></div><div><dt>POD</dt><dd>Ready after sync</dd></div></dl></div> : null}

      {step === 'complete' ? <div className="flow-body completion-step"><span className="completion-icon"><Check size={38} /></span><h2>Dropoff completed</h2><p>{network === 'online' ? 'POD created and central record confirmed.' : 'Saved on device. POD will be created after sync.'}</p><button className="button button--primary" onClick={() => navigate('/')}>Back to Home</button></div> : null}

      {step !== 'complete' ? <div className="sticky-action"><button className="button button--primary" onClick={() => setStep(step === 'scan' ? 'evidence' : step === 'evidence' ? 'recipient' : step === 'recipient' ? 'review' : 'complete')} disabled={step === 'scan' && remaining.length > 0}>{step === 'scan' ? 'Continue to evidence' : step === 'evidence' ? 'Recipient confirmation' : step === 'recipient' ? 'Review Dropoff' : 'Complete Dropoff'}<ChevronRight size={20} /></button></div> : null}
    </div>
  )
}
