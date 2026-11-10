import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from './cargo-components'
import { useCargo } from './cargoStore'
import { communicationPath } from './communicationDomain'
import { operationalName } from './orderDetailsDomain'
import { OrderStopSummary } from './OrderStopSummary'
import { assertCurrentRoute, hasStopConfirmation, isActiveStop, parseStopProgress, progressForStop, readRouteCompletion, readStopProgressSnapshot, stopHandoff, stopProgressKey, updateStopProgress, withRouteStopLock, type StopProgressAction } from './routeStopProgress'
import type { SignedStopVisit } from './orderEbolDomain'
import { spokeOperationLabels, spokeTaskPath, type SpokeOperation } from './spokeDomain'
import { OrderStopNavigation, useOrderStopContext } from './StopNavigation'
import { teamContactsPath } from './teamContactsDomain'
import { useRouteCompletion, useRouteStopProgress } from './useRouteStopProgress'

function useExecution(order: string, operation: SpokeOperation) {
  const [params] = useSearchParams()
  const { spokeRoute } = useCargo()
  const stopId = params.get('stop') || undefined
  const stop = useOrderStopContext(order, operation, stopId)
  const entries = useRouteStopProgress(stop.route)
  const active = entries.find(isActiveStop)
  const task = stopId ? stop.task : spokeRoute?.tasks.find((item) => item.stopId === active?.stopId
    && item.externalId === order && item.operation === operation)
  const progress = task ? progressForStop(entries, task) : undefined
  const routeCompletion = useRouteCompletion(spokeRoute)
  return { stopId, stop, task, progress, spokeRoute, routeCompletion, active }
}

export function useSignAtStop(order: string, operation: SpokeOperation) {
  const { stopId, stop: { route }, task, progress } = useExecution(order, operation)
  const [visitStartedAt] = useState(progress?.startedAt)
  return async (sign: (visit?: SignedStopVisit) => void, supplemental = false) => {
    if ((!stopId && !task) || supplemental) { sign(); return }
    await withRouteStopLock(route, () => {
      assertCurrentRoute(route)
      if (readRouteCompletion(route)) throw new Error('This route has already been completed.')
      const latest = task && progressForStop(parseStopProgress(readStopProgressSnapshot(stopProgressKey(route))), task)
      if (!task || !latest?.startedAt || !isActiveStop(latest) || latest.startedAt !== visitStartedAt) {
        throw new Error('Return to the stop and start it before confirming the handoff.')
      }
      sign({ stopId: task.stopId, startedAt: latest.startedAt })
    })
  }
}

function RouteStopActions({ execution, review = false, missingCargo = false, beforeFail }: {
  execution: ReturnType<typeof useExecution>
  review?: boolean
  missingCargo?: boolean
  beforeFail?: () => boolean
}) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reportingFailure, setReportingFailure] = useState(false)
  const [reason, setReason] = useState('')
  const { stop, task, progress, active, spokeRoute, routeCompletion } = execution
  if (!task) return null
  if (!spokeRoute) return <section className="order-detail-card route-stop-actions" aria-label="Stop progress">
    <h2>Load today’s route first</h2><Link className="ebol-secondary" to="/">Back to Home</Link>
  </section>
  const { route } = stop
  const activeTask = route.tasks.find((item) => active?.stopId === item.stopId
    && active.order === item.externalId && active.operation === item.operation)
  const locked = Boolean(stopHandoff(task)?.lockedAt)
  const failure = progress?.failure
  const ready = Boolean(progress && locked && hasStopConfirmation(task, progress))
  const label = spokeOperationLabels[task.operation]
  const reviewPath = `/orders/${task.externalId}/ebol/${task.operation === 'pickup' ? 'pickup' : 'delivery'}?stop=${encodeURIComponent(task.stopId)}`
  const update = async (action: StopProgressAction) => {
    setSaving(true)
    setError('')
    try {
      if (action === 'fail' && beforeFail && !beforeFail()) {
        setError('Could not save the draft. Check device storage and try again.')
        return
      }
      await updateStopProgress(route, task, action, reason)
      if (action === 'fail') closeFailure()
      if (action === 'start' && review) navigate(spokeTaskPath(task, route.workDate), { replace: true })
    } catch (failure) {
      setError(failure instanceof Error && !(failure instanceof DOMException) ? failure.message : 'Could not save the stop. Try again.')
    } finally {
      setSaving(false)
    }
  }
  const closeFailure = () => {
    setReportingFailure(false)
    setReason('')
    setError('')
  }
  return <section className="order-detail-card route-stop-actions" aria-label="Stop progress">
    <h2>{failure ? 'Stop failed' : progress?.completedAt ? 'Stop completed' : progress ? 'Stop in progress' : locked ? 'Handoff already confirmed' : 'Ready to start'}</h2>
    {progress?.startedAt ? <p>Started <time dateTime={progress.startedAt}>{new Date(progress.startedAt).toLocaleString()}</time></p> : null}
    {progress?.completedAt ? <p>Completed <time dateTime={progress.completedAt}>{new Date(progress.completedAt).toLocaleString()}</time></p> : null}
    {ready && !progress?.completedAt ? <><p>Handoff confirmed. Complete the stop when work at this location is finished.</p><button type="button" className="cargo-primary" disabled={saving} onClick={() => void update('complete')}>Complete stop</button></> : null}
    {!progress && !locked && !reportingFailure ? <>
      {active ? <p>{spokeOperationLabels[active.operation]} for order #{active.order}{activeTask ? ` at stop ${activeTask.sequence}` : ''} is in progress. Finish working on that stop before starting another.</p> : null}
      {missingCargo ? <p>A Pickup record is required before starting Delivery.</p> : null}
      <button type="button" className="cargo-primary" disabled={saving || Boolean(active) || missingCargo} onClick={() => void update('start')}>Start {label}</button>
      {activeTask ? <Link className="ebol-secondary" to={spokeTaskPath(activeTask, route.workDate)}>Return to active stop</Link> : null}
    </> : null}
    {!locked && !failure && !progress?.completedAt ? reportingFailure ? <>
      <label className="ebol-field">Reason for failure<textarea rows={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      <button type="button" className="ebol-secondary route-stop-fail" disabled={saving || !reason.trim()} onClick={() => void update('fail')}>Confirm failure</button>
      <button type="button" className="ebol-secondary" disabled={saving} onClick={closeFailure}>Cancel</button>
    </> : <button type="button" className="ebol-secondary route-stop-fail" disabled={saving} onClick={() => setReportingFailure(true)}>Fail stop</button> : null}
    {failure ? <>
      <p>Failed <time dateTime={failure.at}>{new Date(failure.at).toLocaleString()}</time></p>
      <p className="route-stop-failure-reason"><strong>Reason:</strong> {failure.reason}</p>
      {!routeCompletion ? <button type="button" className="ebol-secondary" disabled={saving} onClick={() => void update('undo')}>Undo</button> : null}
    </> : null}
    {isActiveStop(progress) && locked && !ready ? <p>The signed handoff is linked to a different stop or an earlier visit.</p> : null}
    {!review && locked ? <Link className="ebol-secondary" to={reviewPath}>Open {label} review</Link> : null}
    {progress?.completedAt || failure ? <Link className="ebol-secondary" to="/tasks">Back to Tasks</Link> : null}
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
  const { stopId, stop, task, progress, spokeRoute, routeCompletion } = execution
  if (!stopId) return children
  const label = spokeOperationLabels[operation]
  if (!task) return <div className="cargo-flow">
    <CargoFlowHeader title={label} />
    <main className="order-details-body pickup-form"><p role="alert">This stop is unavailable. Open the current stop from Tasks.</p><Link className="ebol-secondary" to="/tasks">Back to Tasks</Link></main>
    <CargoBottomNav />
  </div>
  const locked = Boolean(stopHandoff(task)?.lockedAt)
  if ((review && locked) || (spokeRoute && !routeCompletion && isActiveStop(progress) && !locked)) return children

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

export function ActiveRouteStopActions({ order, operation, beforeFail }: {
  order: string; operation: SpokeOperation; beforeFail: () => boolean
}) {
  const execution = useExecution(order, operation)
  return isActiveStop(execution.progress) ? <RouteStopActions execution={execution} beforeFail={beforeFail} /> : null
}
