import { ArrowDown, ArrowUp, Barcode, CheckCircle2, ChevronDown, ChevronRight, CloudDownload, FilePenLine, FileText, LoaderCircle, MessageCircleMore, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { operationalName } from '../orderDetailsDomain'
import { summarizeMeasurements, weightText } from '../measurementDomain'
import { calculatePieces } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import { CORPORATE_SMS_NUMBER_LABEL } from '../communicationDomain'
import { useCommunications } from '../communicationStore'
import { getOrderDocumentNavigation } from '../orderEbolNavigation'
import { readOrderEbols } from '../orderEbolStore'
import { readPickupDrafts } from '../pickupDraftStore'
import { filterSpokeTasks, spokeTaskPath } from '../spokeDomain'
import { inspectionStatus, preTripChecks, preTripPhotos } from '../preTripInspectionDomain'
import { usePreTripInspection } from '../preTripInspectionStore'
import { StopNavigation } from '../StopNavigation'

export function CargoHomeScreen() {
  const navigate = useNavigate()
  const { records, spokeRoute, isSpokeRouteLoading, loadTodaySpokeRoute, clearSpokeRoute, getOrderDetails, getOrderCargo } = useCargo()
  const { unreadTotal, threads } = useCommunications()
  const { inspection, postTrip, history, startNextCycle, saveError } = usePreTripInspection()
  const preTripStatus = inspectionStatus(inspection)
  const routeUnlocked = preTripStatus === 'passed' && !postTrip.completedAt
  const [routeQuery, setRouteQuery] = useState('')
  const [recentRecordsExpanded, setRecentRecordsExpanded] = useState(false)
  const [orderEbols] = useState(() => readOrderEbols())
  const [pickupDrafts] = useState(() => readPickupDrafts())
  const visibleTasks = useMemo(() => filterSpokeTasks(spokeRoute?.tasks ?? [], routeQuery), [spokeRoute, routeQuery])
  const pickupCount = spokeRoute?.tasks.filter((task) => task.operation === 'pickup').length ?? 0
  const dropoffCount = (spokeRoute?.tasks.length ?? 0) - pickupCount
  const resetSpokeRoute = () => {
    setRouteQuery('')
    clearSpokeRoute()
  }

  return (
    <CargoShell>
      <div className="cargo-home">
        <h1>Cargo operations</h1>
        <section className="cargo-actions" aria-label="Choose an operation">
          <button type="button" className="cargo-action cargo-action--pickup" onClick={() => navigate('/pickup')}>
            <ArrowUp size={46} /><strong>Pickup</strong><small>Record & start Order eBOL</small>
          </button>
          <button type="button" className="cargo-action cargo-action--dropoff" onClick={() => navigate('/dropoff')}>
            <ArrowDown size={46} /><strong>Dropoff</strong><small>Verify & complete delivery</small>
          </button>
        </section>

        <button type="button" className="home-messages-card" onClick={() => navigate('/communications')}>
          <span className="home-messages-icon"><MessageCircleMore size={26} />{unreadTotal ? <b>{unreadTotal}</b> : null}</span>
          <span>
            <strong>Messages</strong>
            <small>{unreadTotal ? `${unreadTotal} unread · ${threads.length} customer conversations` : `${threads.length} customer conversations`}</small>
            <small>Corporate SMS · {CORPORATE_SMS_NUMBER_LABEL}</small>
          </span>
          <ChevronRight size={20} />
        </button>

        <section className={`pretrip-home-card pretrip-home-card--${preTripStatus}`} aria-labelledby="pretrip-home-title">
          <span className="pretrip-home-icon"><ShieldCheck size={25} /></span>
          <div><p>{postTrip.completedAt ? 'PRE-TRIP RECORD' : routeUnlocked ? 'VEHICLE CLEARED' : preTripStatus === 'blocked' ? 'ROUTE LOCKED' : 'REQUIRED BEFORE ROUTE'}</p><h2 id="pretrip-home-title">Pre-trip inspection</h2><small>{preTripStatus === 'passed' ? `Van 08 · ${preTripChecks.length} checks · ${inspection.photos.length} photos complete` : preTripStatus === 'blocked' ? 'A reported issue must be cleared before departure' : `Van 08 · Safety checklist and ${preTripPhotos.length} required photos`}</small></div>
          <button type="button" onClick={() => navigate('/pre-trip-inspection')}>{preTripStatus === 'passed' ? 'View' : preTripStatus === 'in_progress' || preTripStatus === 'blocked' ? 'Continue' : 'Start'} <ChevronRight size={17} /></button>
        </section>

        {saveError ? <p className="ebol-storage-warning" role="alert">Inspection could not be saved. Check device storage and retry.</p> : null}
        {inspection.completedAt ? <section className="pretrip-home-card" aria-labelledby="posttrip-home-title"><span className="pretrip-home-icon"><ShieldCheck size={25} /></span><div><p>{postTrip.completedAt ? 'VEHICLE CYCLE COMPLETED' : 'AFTER VEHICLE USE'}</p><h2 id="posttrip-home-title">Post-trip inspection</h2><small>{postTrip.completedAt ? Object.values(postTrip.answers).includes('issue') ? 'Completed — issues reported · Needs attention' : 'Completed · Vehicle condition recorded' : 'Van 08 · Checklist and 5 required photos'}</small></div><button type="button" onClick={() => navigate('/post-trip-inspection')}>{postTrip.completedAt ? 'View' : Object.keys(postTrip.answers).length ? 'Continue' : 'Start'} <ChevronRight size={17} /></button></section> : null}
        {postTrip.completedAt ? <button type="button" className="ebol-secondary" onClick={() => { if (startNextCycle()) navigate('/pre-trip-inspection') }}>Start next vehicle cycle</button> : null}
        {history.length ? <details className="order-detail-card"><summary>Previous vehicle inspections ({history.length})</summary>{history.map((cycle, index) => <button className="ebol-secondary" type="button" key={cycle.postTrip.completedAt} onClick={() => navigate(`/post-trip-inspection?cycle=${index}`)}>{new Date(cycle.postTrip.completedAt!).toLocaleString()} · {Object.values(cycle.postTrip.answers).includes('issue') ? 'Issues reported' : 'Completed'}</button>)}</details> : null}

        {!spokeRoute ? (
          <section className="spoke-import" aria-labelledby="spoke-import-title">
            <div className="spoke-import-heading"><span><CloudDownload size={25} /></span><div><h2 id="spoke-import-title">Today’s Spoke route</h2><p>Load today’s stops. External ID becomes the Zaberman order number.</p></div></div>
            <button type="button" onClick={loadTodaySpokeRoute} disabled={isSpokeRouteLoading || !routeUnlocked}>{isSpokeRouteLoading ? <LoaderCircle className="is-spinning" size={20} /> : routeUnlocked ? <CloudDownload size={20} /> : <ShieldCheck size={20} />}{isSpokeRouteLoading ? 'Loading route…' : routeUnlocked ? 'Load today’s route' : 'Complete inspection to unlock'}</button>
          </section>
        ) : (
          <section className="spoke-tasks" aria-labelledby="spoke-tasks-title">
            <header><div><h2 id="spoke-tasks-title">Today’s stops</h2><p>{spokeRoute.name}</p></div><button type="button" aria-label="Remove today’s stops and return to route loading" title="Return to route loading" onClick={resetSpokeRoute}><RefreshCw /></button></header>
            <div className="spoke-sync-state"><CheckCircle2 size={20} /><span><strong>{spokeRoute.tasks.length} stops loaded</strong><small>{pickupCount} Pickup · {dropoffCount} Dropoff · Updated just now</small></span></div>
            <label className="spoke-task-search"><Search size={19} /><input aria-label="Find stop by External ID" inputMode="numeric" placeholder="Find order by External ID" value={routeQuery} onChange={(event) => setRouteQuery(event.target.value)} /></label>
            <div className="spoke-task-list">
              {visibleTasks.map((task) => (
                <div className="home-stop-with-directions" key={task.stopId}><button type="button" disabled={!routeUnlocked} onClick={() => navigate(spokeTaskPath(task, spokeRoute.workDate))}>
                  <span className={`spoke-task-icon spoke-task-icon--${task.operation}`}>{task.operation === 'pickup' ? <ArrowUp size={19} /> : <ArrowDown size={19} />}</span>
                  <span className="spoke-task-main"><strong>#{task.externalId}</strong><small>{String(task.sequence).padStart(2, '0')} · {operationalName(getOrderDetails(task.externalId), task.externalId)}</small><small>Qty {calculatePieces(getOrderCargo(task.externalId)?.dimensionGroups ?? [])} pcs</small></span>
                  <span className={`spoke-task-side spoke-task-side--${task.operation}`}><strong>{task.scheduledTime}</strong><small>{task.operation === 'pickup' ? 'Pickup' : 'Dropoff'}</small></span>
                  <ChevronRight size={19} />
                </button><StopNavigation task={task} compact blockedMessage={!routeUnlocked ? 'Complete Pre-trip inspection before departure' : undefined} /></div>
              ))}
              {!visibleTasks.length ? <div className="spoke-task-empty">No stop found for this External ID.</div> : null}
            </div>
          </section>
        )}

        <section className="order-documents" aria-labelledby="order-documents-title">
          <header><div><h2 id="order-documents-title">Order documents</h2><p>Order eBOL → completed POD</p></div><FileText size={24} /></header>
          {orderEbols.length ? <div className="order-document-list">{orderEbols.slice(0, 3).map((orderEbol) => {
            const destination = getOrderDocumentNavigation(orderEbol)
            return <div className="order-document-row" key={orderEbol.orderNumber}><button type="button" className="order-document-open" onClick={() => navigate(destination.path)}><span className="order-document-icon"><FileText size={19} /></span><span className="order-document-main"><strong>Order eBOL · #{orderEbol.orderNumber}</strong><small>{destination.detailLabel}</small></span><span className={`order-document-status order-document-status--${destination.state}`}>{destination.statusLabel}</span><ChevronRight size={19} /></button><button type="button" className="order-document-labels" aria-label={`Open place labels for order ${orderEbol.orderNumber}`} title="Place labels" onClick={() => navigate(`/orders/${orderEbol.orderNumber}/labels`)}><Barcode size={21} /></button></div>
          })}</div> : <div className="order-documents-empty"><FileText size={21} /><span><strong>No Order eBOL yet</strong><small>Create a Pickup record to start the document.</small></span></div>}
        </section>

        {pickupDrafts.length ? <section className="pickup-drafts-home" aria-labelledby="pickup-drafts-title"><header><div><h2 id="pickup-drafts-title">Pickup drafts</h2><p>Autosaved on this device</p></div><FilePenLine size={23} /></header><div>{pickupDrafts.slice(0, 3).map((draft) => <button type="button" key={`${draft.orderNumber}-${draft.mode}`} onClick={() => navigate(`/pickup?order=${draft.orderNumber}${draft.mode === 'supplemental' ? '&supplemental=1' : ''}`)}><span><strong>#{draft.orderNumber} · {draft.mode === 'supplemental' ? 'Supplemental Pickup' : 'Pickup'}</strong><small>{draft.places.length} editable places · restored automatically</small></span><ChevronRight size={19} /></button>)}</div></section> : null}

        <section className="recent-records">
          <button
            type="button"
            className="recent-records-toggle"
            aria-expanded={recentRecordsExpanded}
            aria-controls="recent-records-list"
            onClick={() => setRecentRecordsExpanded((expanded) => !expanded)}
          >
            <span>
              <strong>Recent operations</strong>
              <small>{records.length > 5 ? `Latest 5 of ${records.length}` : `${records.length} operations`}</small>
            </span>
            <ChevronDown className={recentRecordsExpanded ? 'is-expanded' : ''} size={22} aria-hidden="true" />
          </button>
          {recentRecordsExpanded ? (
            <div className="recent-records-list" id="recent-records-list">
              {records.slice(0, 5).map((record) => {
                const isLocked = Boolean(orderEbols.find((item) => item.orderNumber === record.orderNumber)?.pickup.lockedAt)
                const target = record.status === 'dropoff_complete' ? `/dropoff?order=${record.orderNumber}` : `/pickup?order=${record.orderNumber}${isLocked ? '&supplemental=1' : ''}`
                return (
                <button type="button" key={record.orderNumber} onClick={() => navigate(target)}>
                  <span className={`record-direction record-direction--${record.status}`}><ArrowUp size={19} /></span>
                  <span className="record-main"><strong>#{record.orderNumber}</strong><small>{operationalName(getOrderDetails(record.orderNumber), record.orderNumber)}</small><small>{record.pickupDate} · Qty {calculatePieces(record.dimensionGroups)} pcs / {weightText(record.totalWeight, summarizeMeasurements(record.dimensionGroups))}</small></span>
                  <span className={`record-status record-status--${record.status}`}>{record.status === 'pickup_recorded' ? (isLocked ? 'Add places' : 'Edit Pickup') : 'Dropoff complete'}</span>
                  <ChevronRight size={20} />
                </button>
              )})}
            </div>
          ) : null}
        </section>
      </div>
    </CargoShell>
  )
}
