import { ArrowDown, ArrowUp, CheckCircle2, ChevronRight, CloudDownload, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { calculatePieces } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import { filterSpokeTasks, spokeTaskPath } from '../spokeDomain'

export function CargoHomeScreen() {
  const navigate = useNavigate()
  const { records, spokeRoute, isSpokeRouteLoading, loadTodaySpokeRoute } = useCargo()
  const [routeQuery, setRouteQuery] = useState('')
  const visibleTasks = useMemo(() => filterSpokeTasks(spokeRoute?.tasks ?? [], routeQuery), [spokeRoute, routeQuery])
  const pickupCount = spokeRoute?.tasks.filter((task) => task.operation === 'pickup').length ?? 0
  const dropoffCount = (spokeRoute?.tasks.length ?? 0) - pickupCount

  return (
    <CargoShell>
      <div className="cargo-home">
        <h1>Record cargo</h1>
        <section className="cargo-actions" aria-label="Choose an operation">
          <button type="button" className="cargo-action cargo-action--pickup" onClick={() => navigate('/pickup')}>
            <ArrowUp size={46} /><strong>Pickup</strong><small>Measure and photograph</small>
          </button>
          <button type="button" className="cargo-action cargo-action--dropoff" onClick={() => navigate('/dropoff')}>
            <ArrowDown size={46} /><strong>Dropoff</strong><small>Find and verify</small>
          </button>
        </section>

        {!spokeRoute ? (
          <section className="spoke-import" aria-labelledby="spoke-import-title">
            <div className="spoke-import-heading"><span><CloudDownload size={25} /></span><div><h2 id="spoke-import-title">Today’s Spoke route</h2><p>Load today’s stops. External ID becomes the Zaberman order number.</p></div></div>
            <button type="button" onClick={loadTodaySpokeRoute} disabled={isSpokeRouteLoading}>{isSpokeRouteLoading ? <LoaderCircle className="is-spinning" size={20} /> : <CloudDownload size={20} />}{isSpokeRouteLoading ? 'Loading route…' : 'Load today’s route'}</button>
          </section>
        ) : (
          <section className="spoke-tasks" aria-labelledby="spoke-tasks-title">
            <header><div><h2 id="spoke-tasks-title">Today’s stops</h2><p>{spokeRoute.name}</p></div><button type="button" aria-label="Refresh today’s Spoke route" onClick={loadTodaySpokeRoute} disabled={isSpokeRouteLoading}>{isSpokeRouteLoading ? <LoaderCircle className="is-spinning" /> : <RefreshCw />}</button></header>
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

        <section className="recent-records">
          <h2>Recent records</h2>
          {records.slice(0, 5).map((record) => (
            <button type="button" key={record.orderNumber} onClick={() => navigate(record.status === 'pickup_recorded' ? `/dropoff?order=${record.orderNumber}` : `/dropoff?order=${record.orderNumber}`)}>
              <span className={`record-direction record-direction--${record.status}`}><ArrowUp size={19} /></span>
              <span className="record-main"><strong>#{record.orderNumber}</strong><small>{record.pickupDate} · {calculatePieces(record.dimensionGroups)} pcs / {record.totalWeight} lb</small></span>
              <span className={`record-status record-status--${record.status}`}>{record.status === 'pickup_recorded' ? 'Pickup recorded' : 'Dropoff complete'}</span>
              <ChevronRight size={20} />
            </button>
          ))}
        </section>
      </div>
    </CargoShell>
  )
}
