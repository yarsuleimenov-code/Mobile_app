import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { completeSpokeRoute, summarizeRouteStops, type RouteCompletion, type StopProgress } from './routeStopProgress'
import { spokeTaskPath, type SpokeRoute } from './spokeDomain'

export function RouteCompletionCard({ route, progress, completion, canClose }: {
  route: SpokeRoute
  progress: StopProgress[]
  completion?: RouteCompletion
  canClose: boolean
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { completed, failed, remaining, lastStopAt } = summarizeRouteStops(route, progress)
  const ready = !remaining.length && Boolean(lastStopAt)
  const closeRoute = async () => {
    setSaving(true)
    setError('')
    try { await completeSpokeRoute(route) }
    catch (failure) {
      setError(failure instanceof Error && !(failure instanceof DOMException) ? failure.message : 'Could not save route completion. Try again.')
    } finally { setSaving(false) }
  }

  return <section className="order-detail-card route-completion-card" aria-labelledby="route-completion-title">
    <h2 id="route-completion-title">{completion ? 'Route completed' : ready ? 'Return to warehouse' : 'Route in progress'}</h2>
    <p>{completed} completed · {failed.length} failed · {remaining.length} remaining</p>
    {completion ? <div className="route-completion-time" role="status"><CheckCircle2 size={19} aria-hidden="true" />
      <span>Warehouse return · <time dateTime={completion.completedAt}>{new Date(completion.completedAt).toLocaleString()}</time></span>
    </div> : ready ? <>
      <p>Complete the route when you arrive at the warehouse.</p>
      <button type="button" className="cargo-primary" disabled={saving || !canClose} onClick={() => void closeRoute()}>Complete route</button>
    </> : remaining.length ? <details>
      <summary>Remaining stops ({remaining.length})</summary>
      <ul>{remaining.map((task) => <li key={task.stopId}><Link to={spokeTaskPath(task, route.workDate)}>Stop {task.sequence} · #{task.externalId} · {task.title}</Link></li>)}</ul>
    </details> : null}
    {lastStopAt ? <small>Last stop · <time dateTime={completion?.lastStopAt ?? lastStopAt}>{new Date(completion?.lastStopAt ?? lastStopAt).toLocaleString()}</time></small> : null}
    {failed.length ? <details>
      <summary>Failed stops ({failed.length})</summary>
      <ul>{failed.map(({ task, reason }) => <li key={task.stopId}>Stop {task.sequence} · #{task.externalId} · {reason}</li>)}</ul>
    </details> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>
}
