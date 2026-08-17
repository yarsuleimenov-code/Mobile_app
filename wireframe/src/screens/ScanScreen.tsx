import { Keyboard, ScanLine } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function ScanScreen() {
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const [found, setFound] = useState(false)
  const navigate = useNavigate()
  return (
    <div className="scan-screen">
      <div className="scan-header"><h1>Scan</h1><p>Find a place or continue its active task</p></div>
      <div className="camera-stage">
        <div className="scan-frame"><span /><span /><span /><span /><ScanLine size={42} /></div>
        <p>Place the QR or barcode inside the frame</p>
      </div>
      {found ? (
        <div className="scan-found">
          <span className="success-check">✓</span>
          <div><strong>Place 2 · #12345678</strong><span>Same Day Pickup · NJ1</span><small>ZB-8F2A-02</small></div>
          <button onClick={() => navigate('/pickup/PU-101')}>Open task</button>
        </div>
      ) : null}
      {manual ? (
        <form className="manual-form" onSubmit={(event) => { event.preventDefault(); if (code.trim()) setFound(true) }}>
          <input autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter PlaceID or OrderID" />
          <button className="button button--primary" type="submit">Find</button>
        </form>
      ) : (
        <button className="manual-toggle" onClick={() => setManual(true)}><Keyboard size={20} /> Enter code manually</button>
      )}
      <button className="demo-scan" onClick={() => setFound(true)}>Simulate successful scan</button>
    </div>
  )
}
