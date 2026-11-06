import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { expandCargoPlaces } from './cargoDomain'
import { useCargo } from './cargoStore'
import { approveHandoff, locationMessages, verifyHandoff, type HandoffVerification } from './handoffVerificationDomain'
import { captureHandoffLocation, locationScenarios, readHandoffSettings, writeHandoffSettings, type LocationScenario } from './handoffVerificationStore'
import { mockTodaySpokeRoute, type SpokeOperation } from './spokeDomain'
import { orderContextTasks } from './teamContactsDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'

export function HandoffVerificationSummary({ check }: { check: HandoffVerification }) {
  return <div className="handoff-result" aria-live="polite">
    <strong>{check.qr === 'matched' ? 'QR matches this order' : check.qr === 'wrong_order' ? 'This cargo belongs to another order.' : 'QR not recognized or order not found. Scan the label again.'}</strong>
    <p>Open order #{check.orderNumber} · {check.operation === 'pickup' ? 'Pickup' : 'Delivery'}</p>
    <p>Scanned order: {check.scannedOrder ? `#${check.scannedOrder}` : 'Not found'} · {check.code}</p>
    <p>{check.address || 'Stop address unavailable'}</p>
    <strong>{locationMessages[check.location]}</strong>
    <p>{check.distance === undefined ? 'Distance unavailable' : `Distance: ${Math.round(check.distance)} m`} · Allowed radius: {check.policy.radius} m</p>
    {check.fix ? <p>GPS accuracy: ±{Math.round(check.fix.accuracy)} m</p> : null}
    {check.overridden ? <p><strong>Continued after warning</strong><br />Reason: {check.reason}</p> : null}
  </div>
}

export function HandoffVerificationButton({ order, operation, driver, disabled, label, onConfirm }: {
  order: string; operation: SpokeOperation; driver: string; disabled: boolean; label: string
  onConfirm: (verification: HandoffVerification) => void
}) {
  const { records, findRecord, spokeRoute } = useCargo()
  const { devices } = usePrototypeScenario()
  const [params] = useSearchParams()
  const tasks = orderContextTasks((spokeRoute ?? mockTodaySpokeRoute).tasks, order, operation)
  const routeTask = tasks.find((item) => item.stopId === params.get('stop'))
  const [selectedStop, setSelectedStop] = useState(params.get('stop') ?? '')
  const task = routeTask ?? (tasks.length === 1 && !selectedStop ? tasks[0] : tasks.find((item) => item.stopId === selectedStop))
  const [code, setCode] = useState('')
  const [check, setCheck] = useState<HandoffVerification | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const multipleUnselected = (tasks.length > 1 || Boolean(selectedStop)) && !task
  const labelsForScan = () => {
    const currentRecord = findRecord(order)
    return [...records.filter((record) => record.orderNumber !== order), ...(currentRecord ? [currentRecord] : [])].flatMap(expandCargoPlaces)
  }
  useEffect(() => {
    requestId.current += 1
    setCheck(null); setReason(''); setBusy(false); setError('')
    return () => { requestId.current += 1 }
  }, [order, operation, driver, disabled, selectedStop, code, task?.stopId, task?.address, task?.coordinates?.latitude, task?.coordinates?.longitude])

  const run = async (confirm: boolean) => {
    if (disabled || busy || !code.trim() || multipleUnselected) return
    const request = ++requestId.current
    setBusy(true); setError('')
    if (!confirm) setReason('')
    try {
      const settings = readHandoffSettings()
      const location = await captureHandoffLocation(task, settings)
      if (request !== requestId.current) return
      const labels = labelsForScan()
      const next = verifyHandoff({ orderNumber: order, operation, driver, task, code, labels, ...location, policy: settings })
      setCheck(next)
      if (!confirm || next.qr === 'unknown') return
      const warning = next.qr !== 'matched' || next.location !== 'passed'
      const changed = check?.qr !== next.qr || check?.location !== next.location
        || check?.policy.radius !== next.policy.radius || check?.policy.maxAccuracy !== next.policy.maxAccuracy
      if (warning && (changed || !reason.trim())) { setReason(''); return }
      onConfirm(approveHandoff(next, reason))
    } catch (failure) {
      if (request === requestId.current) setError(failure instanceof Error ? failure.message : 'Check could not be completed. Please retry.')
    } finally { if (request === requestId.current) setBusy(false) }
  }
  const warning = check && (check.qr !== 'matched' || check.location !== 'passed')
  return <section className="handoff-check" aria-label="QR and location verification">
    <h3>Check cargo & location</h3>
    <p>Scan the label for order #{order}. Your location is checked again when you confirm.</p>
    <button type="button" className="ebol-secondary" disabled={disabled || busy || !devices.scanner} onClick={() => {
      const mode = readHandoffSettings().qrScenario
      const place = labelsForScan().find((item) => mode === 'wrong_order' ? item.orderNumber !== order : item.orderNumber === order)
      setCheck(null); setReason(''); setCode(mode === 'unknown' ? 'UNRECOGNIZED-LABEL' : place?.placeId ?? 'UNRECOGNIZED-LABEL')
    }}>{devices.scanner ? 'Scan label' : 'Scanner unavailable · enter code below'}</button>
    {!routeTask && (tasks.length > 1 || (selectedStop && !task)) ? <label className="ebol-field">{operation === 'pickup' ? 'Pickup' : 'Delivery'} stop<select value={selectedStop} disabled={busy} onChange={(event) => setSelectedStop(event.target.value)}><option value="">Select this stop</option>{tasks.map((item) => <option key={item.stopId} value={item.stopId}>{item.sequence}. {item.address}</option>)}</select></label> : null}
    <form onSubmit={(event) => { event.preventDefault(); void run(false) }}>
      <label className="ebol-field">QR / label code<input value={code} onChange={(event) => setCode(event.target.value)} disabled={busy} placeholder="Scan or enter label code" autoComplete="off" /></label>
      <button type="submit" className="ebol-secondary" disabled={disabled || busy || !code.trim() || multipleUnselected}>{busy ? 'Checking location…' : check ? 'Check again' : 'Check QR & location'}</button>
    </form>
    {check ? <div className={warning ? 'measurement-warning' : 'handoff-success'}>
      <HandoffVerificationSummary check={check} />
      {warning ? <button type="button" className="cargo-primary" disabled={busy} onClick={() => { setCheck(null); setReason(''); setError('') }}>Return to check</button> : null}
      {warning && check.qr !== 'unknown' ? <label className="ebol-field">Reason to continue (required)<textarea rows={3} maxLength={1000} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} /></label> : null}
    </div> : null}
    {error ? <p role="alert" className="ebol-storage-warning">{error}</p> : null}
    {check && check.qr !== 'unknown' ? <button type="button" className={warning ? 'ebol-secondary' : 'cargo-primary'} disabled={disabled || busy || (Boolean(warning) && !reason.trim())} onClick={() => void run(true)}>{busy ? 'Checking location…' : warning ? 'Continue & confirm' : label}</button> : null}
  </section>
}

export function HandoffVerificationSettings() {
  const [settings, setSettings] = useState(readHandoffSettings)
  const [message, setMessage] = useState('')
  return <section className="scenario-section">
    <h2>QR & location verification</h2>
    <p>Prototype controls. QR input uses the existing PlaceID registry. Synthetic coordinates below are test fixtures, not geocoded addresses.</p>
    <form onSubmit={(event) => {
      event.preventDefault()
      setMessage(writeHandoffSettings(settings) ? 'Verification settings saved.' : 'Settings could not be saved.')
    }}>
      <label className="ebol-field">Location scenario<select value={settings.scenario} onChange={(event) => { setMessage(''); setSettings({ ...settings, scenario: event.target.value as LocationScenario }) }}>{Object.entries(locationScenarios).map(([value, title]) => <option value={value} key={value}>{title}</option>)}</select></label>
      <label className="ebol-field">Next scanned label<select value={settings.qrScenario} onChange={(event) => { setMessage(''); setSettings({ ...settings, qrScenario: event.target.value as typeof settings.qrScenario }) }}><option value="matched">Current order</option><option value="wrong_order">Another order</option><option value="unknown">Unrecognized label</option></select></label>
      <label className="ebol-field">Allowed radius (m)<input type="number" required min={1} max={10000} value={settings.radius} onChange={(event) => { setMessage(''); setSettings({ ...settings, radius: Number(event.target.value) }) }} /></label>
      <label className="ebol-field">Maximum GPS error (m)<input type="number" required min={1} max={10000} value={settings.maxAccuracy} onChange={(event) => { setMessage(''); setSettings({ ...settings, maxAccuracy: Number(event.target.value) }) }} /></label>
      <p>100 m radius, 50 m GPS error and 30 s freshness are provisional. Confirm before production. Use At the stop for the successful path; use another order’s existing PlaceID for a QR mismatch.</p>
      <button type="submit" className="ebol-secondary">Save verification settings</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  </section>
}
