import { Keyboard, ScanLine } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { usePrototypeScenario } from '../prototypeScenarioStore'
import { useTrackedCargoPlaces } from '../useTrackedCargoPlaces'
import { cargoPlaceStatusLabels } from '../cargoPlaceTracking'
import { resolvePlaceScan, type PlaceScanResult } from '../placeScanDomain'

export function ScanScreen() {
  const [params] = useSearchParams()
  return <ScanContent key={params.toString()} initialCode={params.get('code') ?? ''} />
}

function ScanContent({ initialCode }: { initialCode: string }) {
  const [manual, setManual] = useState(Boolean(initialCode))
  const [code, setCode] = useState(initialCode)
  const [result, setResult] = useState<PlaceScanResult | null>(null)
  const [seenIds, setSeenIds] = useState<string[]>([])
  const places = useTrackedCargoPlaces()
  const sampleCode = places.find((place) => place.placeId === initialCode)?.placeId
    ?? places.find((place) => place.placeId === 'ZB-11155599-02')?.placeId ?? places[0]?.placeId ?? ''
  const navigate = useNavigate()
  const { devices } = usePrototypeScenario()
  const scan = (value: string) => {
    const next = resolvePlaceScan(places, value, seenIds)
    setCode(value)
    setResult(next)
    if (next.kind === 'found') setSeenIds((current) => [...new Set([...current, next.place.placeId])])
  }
  return (
    <CargoShell>
      <div className="scan-screen cargo-nav-screen">
        <div className="scan-header"><h1>Scan</h1><p>Find a place or continue its active task</p></div>
        <div className={`camera-stage ${devices.camera ? '' : 'is-unavailable'}`}>
          <div className="scan-frame"><span /><span /><span /><span /><ScanLine size={42} /></div>
          <p>{devices.camera ? 'Position the barcode inside the frame' : 'Camera unavailable · manual entry remains available'}</p>
        </div>
        {result && (result.kind === 'found' || result.kind === 'duplicate') ? (
          <div className={`scan-found ${result.kind === 'duplicate' ? 'scan-result--duplicate' : ''}`} role="status">
            <span className="success-check">✓</span>
            <div><strong>{result.kind === 'duplicate' ? 'Already scanned this visit' : 'Place found'}</strong><span>Place {result.place.placeNumber}/{result.place.totalPlaces} · #{result.place.orderNumber}</span><small>{result.place.placeId}</small><small>{cargoPlaceStatusLabels[result.place.status]} · {result.place.currentLocation}</small><small>Lookup only · no place added or moved.</small></div>
            <button type="button" onClick={() => navigate(`/places/${result.place.placeId}`)}>Open place</button>
          </div>
        ) : null}
        {result?.kind === 'unknown' ? <div className="scan-result--unknown" role="status"><strong>Code not found</strong><code>{result.code}</code><p>Check the PlaceID or enter it manually. No place was created.</p></div> : null}
        {result?.kind === 'order' ? <div className="scan-found" role="status"><div><strong>Order #{result.orderNumber}</strong><span>{result.count} places found</span></div><button type="button" onClick={() => navigate(`/places?order=${result.orderNumber}`)}>Open order places</button></div> : null}
        {manual ? (
          <form className="manual-form" onSubmit={(event) => { event.preventDefault(); if (code.trim()) scan(code) }}>
            <input aria-label="Place or order code" autoFocus value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter PlaceID or OrderID" />
            <button className="button button--primary" type="submit" disabled={!code.trim()}>Find</button>
          </form>
        ) : (
          <button type="button" className="manual-toggle" onClick={() => setManual(true)}><Keyboard size={20} /> Enter code manually</button>
        )}
        <button type="button" className="demo-scan" disabled={!devices.scanner || !sampleCode} onClick={() => scan(sampleCode)}>{devices.scanner ? 'Scan label' : 'Scanner unavailable'}</button>
        <div className="scan-demo-options"><button type="button" disabled={!devices.scanner || !seenIds.length} onClick={() => scan(seenIds.at(-1)!)}>Repeat last scan</button></div>
      </div>
    </CargoShell>
  )
}
