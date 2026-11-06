import { QRCodeSVG } from 'qrcode.react'
import { Printer, QrCode } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { ZabermanLogo } from '../brand-logo'
import { normalizeOrderNumber } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import { createPlaceLabels, labelVersionName, recordLabelPrint, selectPlaceLabels, type LabelPrintAttempt, type LabelPrintState } from '../placeLabelsDomain'
import { readLabelPrintState, writeLabelPrintState } from '../labelPrintStore'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'
import { usePrototypeScenario } from '../prototypeScenarioStore'
import { labelCheckPath, LabelLocationSummary } from '../HandoffVerification'
import { checkLabelLocation, hasRecordedLabelLocation } from '../handoffVerificationDomain'
import { capturePrototypeLabelLocation, readLabelActivity, saveLabelActivity } from '../handoffVerificationStore'
import { useOrderStopContext } from '../StopNavigation'

export function PlaceLabelsScreen() {
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const [params] = useSearchParams()
  const requestedVersion = params.get('version')
  const stopId = params.get('stop') ?? undefined
  return <PlaceLabelsContent key={`${orderNumber}:${stopId ?? ''}`} orderNumber={orderNumber} requestedVersion={requestedVersion} stopId={stopId} />
}

function PlaceLabelsContent({ orderNumber, requestedVersion, stopId }: { orderNumber: string; requestedVersion: string | null; stopId?: string }) {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const { getOrderCargo, getOrderDetails } = useCargo()
  const { devices, printOutcome } = usePrototypeScenario()
  const record = getOrderCargo(orderNumber)
  const details = getOrderDetails(orderNumber)
  const { task } = useOrderStopContext(orderNumber, 'pickup', stopId)
  const labelContext = { order: orderNumber, operation: 'pickup' as const, stopId: task?.stopId ?? stopId }
  const [orderEbol] = useState(() => findOrderEbol(readOrderEbols(), orderNumber))
  const labels = useMemo(() => record ? createPlaceLabels(record, orderEbol, details) : [], [record, orderEbol, details])
  const versions = [...new Set(labels.map((label) => label.pickupVersion))].sort((a, b) => a - b)
  const [state, setState] = useState<LabelPrintState>(() => {
    const saved = readLabelPrintState(orderNumber)
    if (requestedVersion && versions.some((version) => String(version) === requestedVersion) && saved.scope !== requestedVersion) {
      return { ...saved, scope: requestedVersion, selectedIds: labels.filter((label) => String(label.pickupVersion) === requestedVersion).map((label) => label.placeId) }
    }
    return saved
  })
  const [previewIds, setPreviewIds] = useState<string[] | null>(null)
  const [lastAttempt, setLastAttempt] = useState<LabelPrintAttempt | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [generation, setGeneration] = useState(() => readLabelActivity('generation', labelContext))
  const [locationSaveError, setLocationSaveError] = useState(false)
  const scope = versions.some((version) => String(version) === state.scope) ? state.scope : 'all'
  const visibleLabels = scope === 'all' ? labels : labels.filter((label) => String(label.pickupVersion) === scope)
  const selected = selectPlaceLabels(visibleLabels, state.selectedIds)
  const previewLabels = selectPlaceLabels(labels, previewIds ?? [])
  const scanCode = (previewIds ? previewLabels : selected)[0]?.placeId ?? visibleLabels[0]?.placeId ?? ''
  useEffect(() => {
    if (record) setStorageError(!writeLabelPrintState(orderNumber, state))
  }, [Boolean(record), orderNumber, state])

  const setVersion = (version?: string) => setSearchParams((current) => {
    const next = new URLSearchParams(current)
    if (version) next.set('version', version)
    else next.delete('version')
    return next
  }, { replace: true })

  const openPreview = (ids: string[], fromHistory = false) => {
    const validIds = selectPlaceLabels(labels, ids).map((label) => label.placeId)
    if (!validIds.length) return
    setState((current) => ({ ...current, scope: fromHistory ? 'all' : scope, selectedIds: validIds }))
    if (fromHistory) setVersion()
    setPreviewIds(validIds)
    setLastAttempt(null)
    window.scrollTo(0, 0)
    const generatedAt = new Date().toISOString()
    const location = checkLabelLocation({ task, ...capturePrototypeLabelLocation(task) })
    const next = { ...location, generatedAt, labelIds: validIds }
    setGeneration(next)
    setLocationSaveError(!saveLabelActivity('generation', labelContext, next))
  }
  const simulatePrint = () => {
    const outcome = devices.printer ? printOutcome : 'unavailable'
    const next = recordLabelPrint(state, previewLabels, outcome, crypto.randomUUID())
    if (next === state) return
    setState(next)
    setLastAttempt(next.history[0])
  }

  if (!record) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Place labels" subtitle={`Order #${orderNumber || 'unknown'}`} />
        <div className="place-labels-empty"><QrCode size={44} /><h2>Pickup record not found</h2><p>Save the Pickup before generating its place labels.</p><button type="button" className="cargo-primary" onClick={() => navigate(`/pickup?order=${orderNumber}`)}>Open Pickup</button></div>
        <CargoBottomNav />
      </div>
    )
  }

  return (
    <div className="cargo-flow place-labels-flow">
      <CargoFlowHeader title={previewIds ? 'Label preview' : 'Place labels'} subtitle={`Order #${orderNumber} · ${previewIds ? previewLabels.length : labels.length} labels`}
        onBack={previewIds ? () => { setPreviewIds(null); setLastAttempt(null); window.scrollTo(0, 0) } : undefined} />
      <main className="place-labels-body">
        <section className="place-labels-summary">
          <QrCode size={26} />
          <span><strong>{previewIds ? `${previewLabels.length} labels in this batch` : `${selected.length} selected · ${visibleLabels.length} available`}</strong><small>{previewIds ? 'Only this batch is shown below. Place IDs and original n/N are unchanged.' : 'Select labels, then review the batch. Reprinting keeps the same Place IDs.'}</small></span>
        </section>
        {storageError ? <p className="label-storage-error" role="alert">Selection and history could not be saved. Keep this page open; reload may lose your changes.</p> : null}
        {!devices.printer ? <div className="label-printer-warning" role="status"><strong>Printer unavailable</strong><p>{storageError ? 'Selection is kept in this view only. Restore local storage before reloading.' : 'Your selection stays saved on this device. Preview or continue now; print later.'}</p></div> : null}
        {generation ? <section className={hasRecordedLabelLocation(generation) ? 'handoff-success' : 'measurement-warning'} aria-label="Label generation location">
          <strong>Last label batch · {generation.labelIds.length} labels</strong>
          <p>Generated <time dateTime={generation.generatedAt}>{new Date(generation.generatedAt).toLocaleString()}</time></p>
          <LabelLocationSummary check={generation} />
        </section> : null}
        {locationSaveError ? <p className="label-storage-error" role="alert">The generation location could not be saved on this device.</p> : null}

        {previewIds ? <>
          <div className="place-label-actions label-print-actions">
            <button type="button" className="cargo-primary" disabled={!devices.printer || !previewLabels.length} onClick={simulatePrint}><Printer size={20} />{devices.printer ? 'Print' : 'Printer unavailable'}</button>
            <button type="button" className="ebol-secondary" onClick={() => { setPreviewIds(null); setLastAttempt(null) }}>Change selection</button>
          </div>
          {lastAttempt ? <div className={`label-print-result label-print-result--${lastAttempt.outcome}`} role="status">
            <strong>{lastAttempt.outcome === 'success' ? 'Print successful' : lastAttempt.outcome === 'error' ? 'Print failed' : 'Printer unavailable'}</strong>
            <p>{lastAttempt.labelIds.length} labels · {lastAttempt.reprintedIds.length} reprints.</p>
            {lastAttempt.outcome !== 'success' ? <p>Selection kept. Check the printer connection, then try Print again.</p> : null}
          </div> : null}
        </> : <>
          <div className="label-selection-tools">
            <label>Pickup version<select value={scope} onChange={(event) => {
              const nextScope = event.target.value
              setState((current) => ({ ...current, scope: nextScope, selectedIds: [] }))
              setVersion(nextScope === 'all' ? undefined : nextScope)
            }}>
              <option value="all">All places ({labels.length})</option>
              {versions.map((version) => <option key={version} value={version}>{labelVersionName(version)} ({labels.filter((label) => label.pickupVersion === version).length})</option>)}
            </select></label>
            <button type="button" disabled={!selected.length} onClick={() => setState((current) => ({ ...current, selectedIds: [] }))}>Clear selection</button>
          </div>
          <div className="place-label-actions label-select-actions">
            <button type="button" className="cargo-primary" disabled={!selected.length} onClick={() => openPreview(selected.map((label) => label.placeId))}>Print selected ({selected.length})</button>
            <button type="button" className="ebol-secondary" disabled={!visibleLabels.length} onClick={() => openPreview(visibleLabels.map((label) => label.placeId))}>Print all ({visibleLabels.length})</button>
          </div>
          <section className="label-selection-list" aria-label="Select place labels">
            {visibleLabels.map((label) => <article className="label-selection-row" key={label.placeId}>
              <label><input type="checkbox" aria-label={`Select ${label.placeId}`} checked={selected.some((item) => item.placeId === label.placeId)} onChange={(event) => {
                const checked = event.target.checked
                setState((current) => ({ ...current, selectedIds: checked ? [...new Set([...current.selectedIds, label.placeId])] : current.selectedIds.filter((id) => id !== label.placeId) }))
              }} /><span><strong>{label.placeId}</strong><small>Place {label.placeNumber}/{label.totalPlaces} · Group {label.dimensionGroupNumber} · {label.dimensions}</small><em>{labelVersionName(label.pickupVersion)} · {label.versionLocked ? 'locked' : 'draft'}</em></span></label>
              <button type="button" aria-label={`Print this label ${label.placeId}`} onClick={() => openPreview([label.placeId])}><Printer size={15} />Print this label</button>
            </article>)}
          </section>
        </>}

        {previewIds ? <section className="place-label-sheet" aria-label={`Preview ${previewLabels.length} labels for order ${orderNumber}`}>
          {previewLabels.map((label) => (
            <article className="place-label" key={label.placeId}>
              <header><ZabermanLogo className="place-label-brand-logo" /><span>Place {String(label.placeNumber).padStart(2, '0')} of {label.totalPlaces}</span></header>
              <div className="place-label-order"><span>Order</span><strong>#{label.orderNumber}</strong></div>
              {label.orderTitle ? <p className="place-label-title" title={label.orderTitle}>{label.orderTitle}</p> : null}
              <dl><div className="place-label-route"><dt>Destination</dt><dd>TO {label.destinationBranch}</dd><small>FROM {label.originBranch}</small></div><div><dt>Dimensions</dt><dd>{label.dimensions}</dd></div></dl>
              <p className="place-label-group">Group {label.dimensionGroupNumber} · {labelVersionName(label.pickupVersion)}</p>
              <QRCodeSVG className="place-label-qr" value={label.placeId} size={108} level="M" marginSize={4} role="img" aria-label={`QR code for ${label.placeId}`} />
              <div className="place-label-id"><span>Place ID</span><code>{label.placeId}</code></div>
              <Link className="place-label-record-link" to={`/places/${label.placeId}`}>Open place record</Link>
            </article>
          ))}
        </section> : null}

        <nav className="label-next-actions" aria-label="Continue without printing">
          <Link to={labelCheckPath(labelContext, scanCode)}>Check label / enter PlaceID</Link>
          <Link to={`/orders/${orderNumber}/ebol/pickup${stopId ? `?stop=${encodeURIComponent(stopId)}` : ''}`}>Continue to Pickup review</Link>
        </nav>
        <details className="label-print-history"><summary>Print history ({state.history.length})</summary>
          <p>Last 20 print attempts.</p>
          {state.history.length ? <ol>{state.history.map((attempt) => {
            const available = selectPlaceLabels(labels, attempt.labelIds)
            return <li key={attempt.id}><strong>{attempt.outcome === 'success' ? 'Printed' : attempt.outcome === 'error' ? 'Failed' : 'Printer unavailable'} · {attempt.labelIds.length} labels</strong>
              <time>{new Date(attempt.at).toLocaleString()}</time><small>{attempt.versions.join(', ')} · {attempt.reprintedIds.length} reprints</small>
              <code>{attempt.labelIds.join(', ')}</code>
              {available.length !== attempt.labelIds.length ? <small>{available.length} labels still available; removed places will not be recreated.</small> : null}
              <button type="button" disabled={!available.length} onClick={() => openPreview(attempt.labelIds, true)}>{attempt.outcome === 'success' ? 'Reprint batch' : 'Retry batch'} · preview</button>
            </li>
          })}</ol> : <p>No print attempts yet.</p>}
        </details>

      </main>
      <CargoBottomNav />
    </div>
  )
}
