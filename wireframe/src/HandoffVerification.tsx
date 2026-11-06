import { useState } from 'react'
import { hasRecordedLabelLocation, locationMessages, verifyHandoff, type HandoffVerification, type LabelLocationCheck } from './handoffVerificationDomain'
import { capturePrototypeLabelLocation, readLabelScanScenario, readLabelActivity, saveLabelActivity, writeLabelScanScenario, type LabelContext, type LabelScanScenario } from './handoffVerificationStore'
import { useOrderStopContext } from './StopNavigation'
import type { SpokeTask } from './spokeDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'
import { useTrackedCargoPlaces } from './useTrackedCargoPlaces'

export function labelCheckPath({ order, operation, stopId }: LabelContext, code = '') {
  const params = new URLSearchParams({ order, operation })
  if (stopId) params.set('stop', stopId)
  if (code) params.set('code', code)
  return `/scan?${params}`
}

export function LabelLocationSummary({ check }: { check: LabelLocationCheck }) {
  const recordedWithoutAddress = check.location === 'missing_coordinates' && Boolean(check.fix)
  return <>
    {check.address ? <p>{check.address}</p> : null}
    <strong>{recordedWithoutAddress ? 'Location recorded' : locationMessages[check.location]}</strong>
    <p>{recordedWithoutAddress ? 'No stop coordinates for an address comparison.' : check.distance === undefined ? 'Distance unavailable' : `Distance: ${Math.round(check.distance)} m · Allowed radius: ${check.policy.radius} m`}</p>
    {check.fix ? <p>GPS accuracy: ±{Math.round(check.fix.accuracy)} m</p> : null}
  </>
}

export function HandoffVerificationSummary({ check }: { check: HandoffVerification }) {
  return <div className="handoff-result" aria-live="polite">
    <strong>{check.qr === 'matched' ? 'Label matches this order' : check.qr === 'wrong_order' ? 'This cargo belongs to another order.' : 'Code not recognized. Scan the label again.'}</strong>
    <p>Open order #{check.orderNumber} · {check.operation === 'pickup' ? 'Pickup' : 'Delivery'}</p>
    <p>Scanned order: {check.scannedOrder ? `#${check.scannedOrder}` : 'Not found'} · {check.code}</p>
    <LabelLocationSummary check={check} />
    {check.overridden ? <p><strong>Continued after warning</strong><br />Reason: {check.reason}</p> : null}
  </div>
}

export function LabelVerification({ context, initialCode }: { context: LabelContext; initialCode: string }) {
  const stop = useOrderStopContext(context.order, context.operation, context.stopId)
  const [selectedStop, setSelectedStop] = useState('')
  const task = stop.ambiguous ? stop.route.tasks.find((item) => item.stopId === selectedStop
    && item.externalId === context.order && item.operation === context.operation) : stop.task
  return <section className="handoff-check" aria-label="Label and location check">
    <h3>Check label &amp; location</h3>
    <p>{context.operation === 'pickup' ? 'Pickup' : 'Delivery'} · Order #{context.order}</p>
    {stop.ambiguous ? <label className="ebol-field">Stop<select value={selectedStop} onChange={(event) => setSelectedStop(event.target.value)}>
      <option value="">Select the stop</option>
      {stop.route.tasks.filter((item) => item.externalId === context.order && item.operation === context.operation)
        .map((item) => <option key={item.stopId} value={item.stopId}>{item.sequence}. {item.address}</option>)}
    </select></label> : null}
    <LabelCheckForm key={task?.stopId ?? ''} context={{ ...context, stopId: task?.stopId ?? context.stopId }} initialCode={initialCode} task={task} />
  </section>
}

function LabelCheckForm({ context, initialCode, task }: { context: LabelContext; initialCode: string; task?: SpokeTask }) {
  const { devices } = usePrototypeScenario()
  const places = useTrackedCargoPlaces()
  const [code, setCode] = useState(initialCode)
  const [check, setCheck] = useState(() => readLabelActivity('scan', context))
  const [error, setError] = useState('')
  const run = (value: string) => {
    if (!value.trim()) return
    setCode(value)
    const next = verifyHandoff({ orderNumber: context.order, operation: context.operation, task, code: value,
      labels: places, ...capturePrototypeLabelLocation(task) })
    setCheck(next)
    setError(saveLabelActivity('scan', context, next) ? '' : 'The check could not be saved on this device.')
  }
  const scan = () => {
    const mode = readLabelScanScenario()
    const place = mode === 'wrong_order' ? places.find((item) => item.orderNumber !== context.order)
      : places.find((item) => item.orderNumber === context.order && item.placeId === initialCode)
        ?? places.find((item) => item.orderNumber === context.order)
    run(mode === 'unknown' ? 'UNRECOGNIZED-LABEL' : place?.placeId ?? 'UNRECOGNIZED-LABEL')
  }
  return <>
    <button type="button" className="ebol-secondary" disabled={!devices.scanner} onClick={scan}>{devices.scanner ? 'Scan label' : 'Scanner unavailable · enter code below'}</button>
    <form onSubmit={(event) => { event.preventDefault(); run(code) }}>
      <label className="ebol-field">Label code<input value={code} onChange={(event) => { setCode(event.target.value); setCheck(null) }} placeholder="Enter PlaceID" autoComplete="off" /></label>
      <button type="submit" className="ebol-secondary" disabled={!code.trim()}>Check label &amp; location</button>
    </form>
    {check ? <div className={check.qr === 'matched' && hasRecordedLabelLocation(check) ? 'handoff-success' : 'measurement-warning'}>
      <p>Last checked <time dateTime={check.checkedAt}>{new Date(check.checkedAt).toLocaleString()}</time></p>
      <HandoffVerificationSummary check={check} />
    </div> : null}
    {error ? <p role="alert">{error}</p> : null}
  </>
}

export function HandoffVerificationSettings() {
  const [scenario, setScenario] = useState(readLabelScanScenario)
  const [message, setMessage] = useState('')
  return <section className="scenario-section">
    <h2>QR & location verification</h2>
    <p>Prototype controls. QR input uses the existing PlaceID registry. Synthetic coordinates below are test fixtures, not geocoded addresses.</p>
    <form onSubmit={(event) => {
      event.preventDefault()
      setMessage(writeLabelScanScenario(scenario) ? 'Verification settings saved.' : 'Settings could not be saved.')
    }}>
      <label className="ebol-field">Next scanned label<select value={scenario} onChange={(event) => { setMessage(''); setScenario(event.target.value as LabelScanScenario) }}><option value="matched">Current order</option><option value="wrong_order">Another order</option><option value="unknown">Unrecognized label</option></select></label>
      <button type="submit" className="ebol-secondary">Save verification settings</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  </section>
}
