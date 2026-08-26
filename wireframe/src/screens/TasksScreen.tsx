import { ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { useCargo } from '../cargoStore'
import { filterSpokeTasks, mockTodaySpokeRoute, spokeTaskPath, type SpokeOperation } from '../spokeDomain'

type Filter = 'all' | SpokeOperation

export function TasksScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const { spokeRoute } = useCargo()
  const route = spokeRoute ?? mockTodaySpokeRoute
  const visible = useMemo(() => filterSpokeTasks(route.tasks, query).filter((task) => (
    filter === 'all' || task.operation === filter
  )), [filter, query, route.tasks])

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
          {visible.map((task) => (
            <Link key={task.stopId} to={spokeTaskPath(task, route.workDate)} className="task-card">
              <div className={`task-card-mark task-card-mark--${task.operation}`} />
              <div className="task-card-main">
                <span className="task-card-top"><strong>#{task.externalId}</strong><time>{task.scheduledTime}</time></span>
                <span>{task.title}</span><small>{task.address}</small>
                <div><span className={`task-type task-type--${task.operation}`}>{task.operation}</span><span className="movement">Stop {task.sequence}</span></div>
              </div>
              <ChevronRight size={20} />
            </Link>
          ))}
          {!visible.length ? <p className="spoke-task-empty">No tasks match the current filters.</p> : null}
        </div>
      </div>
    </CargoShell>
  )
}
