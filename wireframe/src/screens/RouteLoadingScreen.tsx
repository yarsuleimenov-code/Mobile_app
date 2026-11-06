import { Check, ChevronDown, CircleAlert, ScanLine, Truck } from 'lucide-react'
import { useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { OrderStopSummary } from '../OrderStopSummary'
import { getOrderReferenceData, hasRefreshedOrderReference } from '../orderReferenceData'
import { ReferencePhotoGallery } from '../ReferencePhotoGallery'
import { readPackingPhotos } from '../packingPhotoStore'
import { PhotoGallery } from '../PhotoEvidence'
import type { EvidencePhoto } from '../photoEvidenceDomain'
import { findPlaceByCode } from '../placeScanDomain'
import { usePrototypeScenario } from '../prototypeScenarioStore'
import { canCompleteRouteLoading, expectedLoadPlaces, routeLoadingIssue, warehouseLoadOrders, type RouteLoadingAction, type RouteLoadingPlan, type RouteLoadingStop } from '../routeLoadingDomain'
import { nextRouteLoadingPlan, warehouseWorkDate } from '../routeLoadingFixture'
import { readRouteLoadingSession, routeLoadingSnapshot, saveRouteLoadingAction, subscribeToRouteLoading } from '../routeLoadingStore'
import { spokeOperationLabels } from '../spokeDomain'
import { useTrackedCargoPlaces } from '../useTrackedCargoPlaces'

function WarehouseBrokerPhotos({ order }: { order: string }) {
  const { photos } = getOrderReferenceData(order, hasRefreshedOrderReference(order))
  return <details className="warehouse-photo-group">
    <summary>Broker photos ({photos.length})</summary>
    <ReferencePhotoGallery photos={photos} />
  </details>
}

function WarehousePackingPhotos({ stop }: { stop: RouteLoadingStop }) {
  const saved = readPackingPhotos(stop.externalId)
  const sample: EvidencePhoto = { id: `packing-${stop.externalId}`, orderNumber: stop.externalId, handoff: 'pickup',
    category: 'packaging', asset: 0, source: 'fixture' }
  const photos = saved.length || !stop.packingPhotoSample ? saved : [sample]
  return <details className="warehouse-photo-group">
    <summary>Packing photos ({photos.length})</summary>
    <PhotoGallery photos={photos} packing />
  </details>
}

function PlannedRoute({ plan }: { plan: RouteLoadingPlan }) {
  return <section className="loading-orders warehouse-loading-orders" aria-label="Planned stops">
    {plan.stops.map((stop) => <article key={stop.stopId}>
      <details>
        <summary className="loading-order-head warehouse-order-summary">
          <span><strong>#{stop.externalId} · {stop.title}</strong><small>Stop {stop.sequence} · {stop.scheduledTime}</small></span>
          <b className={`spoke-task-operation spoke-task-operation--${stop.operation}`}>{spokeOperationLabels[stop.operation]}</b><ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className="warehouse-preview-details">
          <OrderStopSummary order={stop.externalId} name={stop.title} operation={stop.operation} task={stop} actions={null} />
          <WarehouseBrokerPhotos order={stop.externalId} />
          {stop.operation === 'dropoff' ? <>
            <p>{stop.loadSource === 'route_pickup' ? 'Picked up during this route' : stop.placeIds?.length ? `${stop.placeIds.length} places to load` : 'Place list needs review'}</p>
            <WarehousePackingPhotos stop={stop} />
          </> : null}
        </div>
      </details>
    </article>)}
  </section>
}

function DeliveryLoadOrders({ plan, loaded, completed, busy, onRemove }: {
  plan: RouteLoadingPlan
  loaded: Set<string>
  completed: boolean
  busy: boolean
  onRemove: (placeId: string) => void
}) {
  return <section className="loading-orders warehouse-loading-orders" aria-label="Delivery orders to load">
    {warehouseLoadOrders(plan).map((stop) => {
      const ids = stop.placeIds ?? []
      const loadedCount = ids.filter((id) => loaded.has(id)).length
      return <article key={stop.stopId} aria-label={`Delivery order ${stop.externalId}`}>
        <div className="loading-order-head warehouse-order-summary">
          <span><strong>#{stop.externalId} · {stop.title}</strong><small>Delivery · Stop {stop.sequence} · {stop.scheduledTime}</small></span>
          <em>{loadedCount} / {ids.length} places</em>
        </div>
        <ul className="warehouse-place-list">
          {ids.map((id) => <li key={id}>
            <span><code>{id}</code><small className={loaded.has(id) ? 'warehouse-place-loaded' : ''}>{loaded.has(id) ? 'Loaded' : 'Missing'}</small></span>
            {!completed && loaded.has(id) ? <button type="button" className="ebol-secondary" disabled={busy} aria-label={`Remove ${id} from load`} onClick={() => onRemove(id)}>Remove</button> : null}
          </li>)}
        </ul>
        <WarehouseBrokerPhotos order={stop.externalId} />
        <WarehousePackingPhotos stop={stop} />
      </article>
    })}
  </section>
}

export function RouteLoadingScreen() {
  const navigate = useNavigate()
  const { devices } = usePrototypeScenario()
  const places = useTrackedCargoPlaces()
  const [scope] = useState(() => {
    const today = nextRouteLoadingPlan(warehouseWorkDate(0))
    const inProgress = readRouteLoadingSession(today)
    return inProgress && !inProgress.completedAt ? today : nextRouteLoadingPlan(warehouseWorkDate(1))
  })
  const snapshot = useSyncExternalStore(subscribeToRouteLoading, () => routeLoadingSnapshot(scope))
  const session = useMemo(() => readRouteLoadingSession(scope, snapshot), [scope, snapshot])
  const plan = session?.plan ?? scope
  const [showRoute, setShowRoute] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const scanInput = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string }>()
  const preview = !session || showRoute
  const completedAt = session?.completedAt
  const complete = Boolean(completedAt)
  const readyToComplete = Boolean(session && canCompleteRouteLoading(session))
  const expected = expectedLoadPlaces(plan)
  const loaded = new Set(session?.loadedPlaceIds)
  const nextPlace = expected.find(({ placeId }) => !loaded.has(placeId))
  const issue = routeLoadingIssue(plan)
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${plan.workDate}T00:00:00Z`))

  const change = async (action: RouteLoadingAction) => {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setFeedback(undefined)
    try {
      const updated = await saveRouteLoadingAction(plan, action)
      if (action.type === 'start') setShowRoute(false)
      if (action.type === 'scan') {
        const place = findPlaceByCode(expectedLoadPlaces(updated.plan), action.code)
        if (place) setFeedback({ type: 'success', message: `${place.placeId} loaded · Order #${place.order}` })
      }
      if (action.type === 'remove') setFeedback({ type: 'success', message: `${action.placeId} removed from this load.` })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error && !(error instanceof DOMException)
        ? error.message : 'Could not save loading progress. Check device storage and try again.' })
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  const scan = (value: string) => {
    if (saving.current || !value.trim()) return
    const knownPlace = Boolean(findPlaceByCode(places, value))
      || plan.stops.some((stop) => stop.placeIds?.some((id) => id.toUpperCase() === value.trim().toUpperCase()))
    setCode('')
    void change({ type: 'scan', code: value, knownPlace })
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    scan(code)
    scanInput.current?.focus()
  }

  return <div className="cargo-flow route-loading-flow">
    <CargoFlowHeader title="Route Loading" subtitle={`${plan.warehouse} · ${dateLabel}`} onBack={() => navigate('/')} />
    <main className="loading-body warehouse-loading-body">
      <section className="place-labels-summary" aria-label="Route assignment">
        <Truck size={26} aria-hidden="true" /><span><strong>{plan.name}</strong><small>{plan.vehicle}</small></span>
      </section>
      {preview ? <>
        <div className="loading-progress">
          <strong>{plan.stops.length} stops · {warehouseLoadOrders(plan).length} Delivery orders to load</strong>
          <p>{expected.length} places planned at {plan.warehouse}</p>
        </div>
        {issue ? <p className="measurement-warning" role="alert">{issue}</p> : null}
        {session ? <button type="button" className="cargo-primary" onClick={() => setShowRoute(false)}>{complete ? 'View completed load' : 'Resume loading'}</button> :
          <button type="button" className="cargo-primary" disabled={busy || Boolean(issue)} onClick={() => void change({ type: 'start' })}>Start loading</button>}
      </> : <>
        <section className="loading-progress" aria-label="Loading progress">
          <strong>{loaded.size} of {expected.length} places loaded</strong>
          <div><span style={{ width: `${expected.length ? loaded.size / expected.length * 100 : 0}%` }} /></div>
          {completedAt ? <p role="status"><strong>Loading complete</strong> · {new Date(completedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })}</p> :
            <p>{expected.length - loaded.size} remaining</p>}
        </section>
        {!complete ? <>
          <div className="warehouse-scan">
            <button type="button" className="cargo-primary" disabled={busy || !devices.scanner || !nextPlace}
              onClick={() => { if (nextPlace) scan(nextPlace.placeId) }}>
              <ScanLine size={21} aria-hidden="true" />{devices.scanner ? 'Scan label' : 'Scanner unavailable'}
            </button>
            <form className="unloading-scan" onSubmit={submit}>
              <input ref={scanInput} aria-label="PlaceID" placeholder="Scan or enter PlaceID" value={code} onChange={(event) => setCode(event.target.value)}
                autoComplete="off" autoCapitalize="characters" />
              <button type="submit" disabled={busy || !code.trim()}>Add</button>
            </form>
          </div>
          <button type="button" className="ebol-secondary" onClick={() => setShowRoute(true)}>View planned route</button>
          <button type="button" className={readyToComplete ? 'cargo-primary' : 'ebol-secondary warehouse-complete-load'} disabled={busy || !readyToComplete}
            onClick={() => void change({ type: 'complete' })}>Complete loading</button>
        </> : <button type="button" className="ebol-secondary" onClick={() => setShowRoute(true)}>View planned route</button>}
      </>}
      {feedback ? <div className={`scan-feedback is-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
        {feedback.type === 'success' ? <Check size={20} aria-hidden="true" /> : <CircleAlert size={20} aria-hidden="true" />}<span>{feedback.message}</span>
      </div> : null}
      {preview ? <PlannedRoute plan={plan} /> :
        <DeliveryLoadOrders plan={plan} loaded={loaded} completed={complete} busy={busy} onRemove={(placeId) => void change({ type: 'remove', placeId })} />}
    </main>
    <CargoBottomNav />
  </div>
}
