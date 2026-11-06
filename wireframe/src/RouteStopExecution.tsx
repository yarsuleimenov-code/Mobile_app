import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from './cargo-components'
import { useCargo } from './cargoStore'
import { communicationPath } from './communicationDomain'
import { operationalName } from './orderDetailsDomain'
import { OrderStopSummary } from './OrderStopSummary'
import { hasStopConfirmation, progressForStop, stopHandoff, updateStopProgress } from './routeStopProgress'
import { spokeOperationLabels, spokeTaskPath, type SpokeOperation } from './spokeDomain'
import { OrderStopNavigation, useOrderStopContext } from './StopNavigation'
import { teamContactsPath } from './teamContactsDomain'
import { useRouteStopProgress } from './useRouteStopProgress'

function useExecution(order: string, operation: SpokeOperation) {
  const [params] = useSearchParams()
  const stopId = params.get('stop') || undefined
  const stop = useOrderStopContext(order, operation, stopId)
  const entries = useRouteStopProgress(stop.route)
  const task = stopId ? stop.task : undefined
  const progress = task ? progressForStop(entries, task) : undefined
  return { stopId, stop, task, progress, active: entries.find((entry) => !entry.completedAt) }
}

function RouteStopActions({ execution, review = false, missingCargo = false }: {
  execution: ReturnType<typeof useExecution>
  review?: boolean
  missingCargo?: boolean
}) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { stop, task, progress, active } = execution
  if (!task) return null
  const { route } = stop
  const activeTask = route.tasks.find((item) => active?.stopId === item.stopId
    && active.order === item.externalId && active.operation === item.operation)
  const locked = Boolean(stopHandoff(task)?.lockedAt)
  const ready = Boolean(progress && locked && hasStopConfirmation(task, progress))
  const label = spokeOperationLabels[task.operation]
  const reviewPath = `/orders/${task.externalId}/ebol/${task.operation === 'pickup' ? 'pickup' : 'delivery'}?stop=${encodeURIComponent(task.stopId)}`
  const update = async (action: 'start' | 'complete') => {
    setSaving(true)
    setError('')
    try {
      await updateStopProgress(route, task, action)
      if (action === 'start' && review) navigate(spokeTaskPath(task, route.workDate), { replace: true })
    } catch (failure) {
      setError(failure instanceof Error && !(failure instanceof DOMException) ? failure.message : 'Could not save the stop. Try again.')
    } finally {
      setSaving(false)
    }
  }
  return <section className="order-detail-card route-stop-actions" aria-label="Stop progress">
    <h2>{progress?.completedAt ? 'Stop completed' : progress ? 'Stop in progress' : locked ? 'Handoff already confirmed' : 'Ready to start'}</h2>
    {progress ? <p>Started <time dateTime={progress.startedAt}>{new Date(progress.startedAt).toLocaleString()}</time></p> : null}
    {progress?.completedAt ? <p>Completed <time dateTime={progress.completedAt}>{new Date(progress.completedAt).toLocaleString()}</time></p> : null}
    {ready && !progress?.completedAt ? <><p>Handoff confirmed. Complete the stop when work at this location is finished.</p><button type="button" className="cargo-primary" disabled={saving} onClick={() => void update('complete')}>Complete stop</button></> : null}
    {!progress && !locked ? <>
      {active ? <p>{spokeOperationLabels[active.operation]} for order #{active.order}{activeTask ? ` at stop ${activeTask.sequence}` : ''} is in progress. Complete that stop before starting another.</p> : null}
      {missingCargo ? <p>A Pickup record is required before starting Delivery.</p> : null}
      <button type="button" className="cargo-primary" disabled={saving || Boolean(active) || missingCargo} onClick={() => void update('start')}>Start {label}</button>
      {activeTask ? <Link className="ebol-secondary" to={spokeTaskPath(activeTask, route.workDate)}>Return to active stop</Link> : null}
    </> : null}
    {progress && locked && !ready && !progress.completedAt ? <p>The signed handoff is linked to a different stop or an earlier visit.</p> : null}
    {!review && locked ? <Link className="ebol-secondary" to={reviewPath}>Open {label} review</Link> : null}
    {progress?.completedAt ? <Link className="ebol-secondary" to="/tasks">Back to Tasks</Link> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>
}

export function RouteStopGate({ order, operation, review = false, children }: {
  order: string
  operation: SpokeOperation
  review?: boolean
  children: ReactNode
}) {
  const execution = useExecution(order, operation)
  const { getOrderDetails, getOrderCargo, findRecord } = useCargo()
  const { stopId, stop, task, progress } = execution
  if (!stopId) return children
  const label = spokeOperationLabels[operation]
  if (!task) return <div className="cargo-flow">
    <CargoFlowHeader title={label} />
    <main className="order-details-body pickup-form"><p role="alert">This stop is unavailable. Open the current stop from Tasks.</p><Link className="ebol-secondary" to="/tasks">Back to Tasks</Link></main>
    <CargoBottomNav />
  </div>
  const locked = Boolean(stopHandoff(task)?.lockedAt)
  if ((review && locked) || (progress && !progress.completedAt && !locked)) return children

  const details = getOrderDetails(order)
  const comment = getOrderCargo(order)?.orderComment
  return <div className="cargo-flow">
    <CargoFlowHeader title={label} />
    <main className="pickup-form order-details-body route-stop-overview">
      <OrderStopSummary order={order} name={operationalName(details, order, task.title)} operation={operation} task={task} plannedDate={stop.plannedDate}
        actions={<>
          <Link className="order-details-action" to={teamContactsPath(order, operation, task.stopId)}>Order details</Link>
          <Link to={communicationPath(order)}>SMS</Link>
        </>}>
        {comment ? <div><h3>Order comment</h3><p>{comment}</p></div> : null}
      </OrderStopSummary>
      <OrderStopNavigation order={order} operation={operation} stop={stop} />
      <RouteStopActions execution={execution} review={review} missingCargo={operation === 'dropoff' && !findRecord(order)} />
    </main>
    <CargoBottomNav />
  </div>
}

export function CompleteRouteStop({ order, operation }: { order: string; operation: SpokeOperation }) {
  const execution = useExecution(order, operation)
  return execution.progress ? <RouteStopActions execution={execution} review /> : null
}
