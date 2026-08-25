import { ArrowDown, ArrowUp, Barcode, CheckCircle2, ChevronDown, ChevronRight, CloudDownload, FileText, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { calculatePieces } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import { getOrderDocumentNavigation } from '../orderEbolNavigation'
import { readOrderEbols } from '../orderEbolStore'
import { filterSpokeTasks, spokeTaskPath } from '../spokeDomain'

export function CargoHomeScreen() {
  const navigate = useNavigate()
  const { records, spokeRoute, isSpokeRouteLoading, loadTodaySpokeRoute, clearSpokeRoute } = useCargo()
  const [routeQuery, setRouteQuery] = useState('')
  const [recentRecordsExpanded, setRecentRecordsExpanded] = useState(false)
  const [orderEbols] = useState(() => readOrderEbols())
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

        {!spokeRoute ? (
          <section className="spoke-import" aria-labelledby="spoke-import-title">
            <div className="spoke-import-heading"><span><CloudDownload size={25} /></span><div><h2 id="spoke-import-title">Today’s Spoke route</h2><p>Load today’s stops. External ID becomes the Zaberman order number.</p></div></div>
            <button type="button" onClick={loadTodaySpokeRoute} disabled={isSpokeRouteLoading}>{isSpokeRouteLoading ? <LoaderCircle className="is-spinning" size={20} /> : <CloudDownload size={20} />}{isSpokeRouteLoading ? 'Loading route…' : 'Load today’s route'}</button>
          </section>
        ) : (
          <section className="spoke-tasks" aria-labelledby="spoke-tasks-title">
            <header><div><h2 id="spoke-tasks-title">Today’s stops</h2><p>{spokeRoute.name}</p></div><button type="button" aria-label="Remove today’s stops and return to route loading" title="Return to route loading" onClick={resetSpokeRoute}><RefreshCw /></button></header>
            <div className="spoke-sync-state"><CheckCircle2 size={20} /><span><strong>{spokeRoute.tasks.length} stops loaded</strong><small>{pickupCount} Pickup · {dropoffCount} Dropoff · Updated just now</small></span></div>
            <label className="spoke-task-search"><Search size={19} /><input aria-label="Find stop by External ID" inputMode="numeric" placeholder="Find order by External ID" value={routeQuery} onChange={(event) => setRouteQuery(event.target.value)} /></label>
            <div className="spoke-task-list">
              {visibleTasks.map((task) => (
                <button type="button" key={task.stopId} onClick={() => navigate(spokeTaskPath(task, spokeRoute.workDate))}>
                  <span className={`spoke-task-icon spoke-task-icon--${task.operation}`}>{task.operation === 'pickup' ? <ArrowUp size={19} /> : <ArrowDown size={19} />}</span>
                  <span className="spoke-task-main"><strong>#{task.externalId}</strong><small>{String(task.sequence).padStart(2, '0')} · {task.title}</small><small>{task.address}</small></span>
                  <span className={`spoke-task-side spoke-task-side--${task.operation}`}><strong>{task.scheduledTime}</strong><small>{task.operation === 'pickup' ? 'Pickup' : 'Dropoff'}</small></span>
                  <ChevronRight size={19} />
                </button>
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
              {records.slice(0, 5).map((record) => (
                <button type="button" key={record.orderNumber} onClick={() => navigate(`/dropoff?order=${record.orderNumber}`)}>
                  <span className={`record-direction record-direction--${record.status}`}><ArrowUp size={19} /></span>
                  <span className="record-main"><strong>#{record.orderNumber}</strong><small>{record.pickupDate} · {calculatePieces(record.dimensionGroups)} pcs / {record.totalWeight} lb</small></span>
                  <span className={`record-status record-status--${record.status}`}>{record.status === 'pickup_recorded' ? 'Pickup recorded' : 'Dropoff complete'}</span>
                  <ChevronRight size={20} />
                </button>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </CargoShell>
  )
}
