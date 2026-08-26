import { Keyboard, ScanLine } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { usePrototypeScenario } from '../prototypeScenarioStore'

export function ScanScreen() {
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const [found, setFound] = useState(false)
  const navigate = useNavigate()
  const { devices } = usePrototypeScenario()
  return (
    <CargoShell>
      <div className="scan-screen cargo-nav-screen">
        <div className="scan-header"><h1>Scan</h1><p>Find a place or continue its active task</p></div>
        <div className={`camera-stage ${devices.camera ? '' : 'is-unavailable'}`}>
          <div className="scan-frame"><span /><span /><span /><span /><ScanLine size={42} /></div>
          <p>{devices.camera ? 'Place the QR or barcode inside the frame' : 'Camera unavailable in the current prototype scenario'}</p>
        </div>
        {found ? (
          <div className="scan-found">
            <span className="success-check">✓</span>
            <div><strong>Place 2/11 · #11155599</strong><span>Ready for loading · NJ1</span><small>ZB-11155599-02</small></div>
            <button type="button" onClick={() => navigate('/places/ZB-11155599-02')}>Open place</button>
          </div>
        ) : null}
        {manual ? (
          <form className="manual-form" onSubmit={(event) => { event.preventDefault(); if (code.trim()) setFound(true) }}>
            <input aria-label="Place or order code" autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter PlaceID or OrderID" />
            <button className="button button--primary" type="submit">Find</button>
          </form>
        ) : (
          <button type="button" className="manual-toggle" onClick={() => setManual(true)}><Keyboard size={20} /> Enter code manually</button>
        )}
        <button type="button" className="demo-scan" disabled={!devices.scanner} onClick={() => setFound(true)}>{devices.scanner ? 'Simulate successful scan' : 'Scanner unavailable'}</button>
      </div>
    </CargoShell>
  )
}
