import { ChevronRight, MessageCircleMore, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { calculatePieces } from '../cargoDomain'
import { communicationPath } from '../communicationDomain'
import { useCommunications } from '../communicationStore'
import { operationalName } from '../orderDetailsDomain'
import { useCargo } from '../cargoStore'
import { filterSpokeTasks, mockTodaySpokeRoute, spokeTaskPath, type SpokeOperation } from '../spokeDomain'
import { teamContactsPath } from '../teamContactsDomain'
import { StopNavigation } from '../StopNavigation'

type Filter = 'all' | SpokeOperation

export function TasksScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const { spokeRoute, getOrderDetails, getOrderCargo } = useCargo()
  const { getThread } = useCommunications()
  const route = spokeRoute ?? mockTodaySpokeRoute
  const visible = filterSpokeTasks(route.tasks.map((task) => ({ ...task, title: operationalName(getOrderDetails(task.externalId), task.externalId) })), query).filter((task) => filter === 'all' || task.operation === filter)

  return (
    <CargoShell>
      <div className="screen-pad cargo-nav-screen">
        <div className="screen-title"><h1>Tasks</h1><p>Today · {route.name}</p></div>
        <label className="search-field"><Search size={19} /><input aria-label="Search tasks" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order ID or title" /></label>
        <div className="filter-row" aria-label="Task filters">
          {(['all', 'pickup', 'dropoff'] as Filter[]).map((item) => (
            <button type="button" key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>
              {item === 'all' ? 'All' : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <div className="task-list">
          {visible.map((task) => {
            const thread = getThread(task.externalId)
            return <div className="task-with-details" key={task.stopId}><Link to={spokeTaskPath(task, route.workDate)} className="task-card">
              <div className={`task-card-mark task-card-mark--${task.operation}`} />
              <div className="task-card-main">
                <span className="task-card-top"><strong>#{task.externalId}</strong><time>{task.scheduledTime}</time></span>
                <span>{task.title}</span>
                <div><span className={`task-type task-type--${task.operation}`}>{task.operation}</span><span className="movement">Stop {task.sequence}</span><span className="task-quantity">Qty {calculatePieces(getOrderCargo(task.externalId)?.dimensionGroups ?? [])} pcs</span></div>
              </div>
              <ChevronRight size={20} />
            </Link><StopNavigation task={task} compact /><div className="task-secondary-actions"><Link className="task-details-link" to={teamContactsPath(task.externalId, task.operation, task.stopId)}>Order details</Link><Link className="task-message-link" to={communicationPath(task.externalId)}><MessageCircleMore size={16} /> Message customer{thread?.unreadCount ? <b>{thread.unreadCount}</b> : null}</Link></div></div>
          })}
          {!visible.length ? <p className="spoke-task-empty">No tasks match the current filters.</p> : null}
        </div>
      </div>
    </CargoShell>
  )
}
