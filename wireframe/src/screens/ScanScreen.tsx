import { Keyboard, ScanLine } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoShell } from '../cargo-components'

export function ScanScreen() {
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const [found, setFound] = useState(false)
  const navigate = useNavigate()
  return (
    <CargoShell>
      <div className="scan-screen cargo-nav-screen">
        <div className="scan-header"><h1>Scan</h1><p>Find a place or continue its active task</p></div>
        <div className="camera-stage">
          <div className="scan-frame"><span /><span /><span /><span /><ScanLine size={42} /></div>
          <p>Place the QR or barcode inside the frame</p>
        </div>
        {found ? (
          <div className="scan-found">
            <span className="success-check">✓</span>
            <div><strong>Place 2 · #23343775</strong><span>Pickup · NJ1</span><small>ZB-23343775-02</small></div>
            <button type="button" onClick={() => navigate('/pickup?order=23343775')}>Open task</button>
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
        <button type="button" className="demo-scan" onClick={() => setFound(true)}>Simulate successful scan</button>
      </div>
    </CargoShell>
  )
}
