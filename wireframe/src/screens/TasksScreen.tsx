import { ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MovementLabel } from '../components'
import { tasks } from '../data'
import type { MovementType } from '../domain'

type Filter = 'all' | 'pickup' | 'dropoff' | MovementType

export function TasksScreen() {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const visible = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.type === filter || task.movementType === filter
    const haystack = `${task.orderId} ${task.address} ${task.city}`.toLowerCase()
    return matchesFilter && haystack.includes(query.toLowerCase())
  }), [filter, query])

  return (
    <div className="screen-pad">
      <div className="screen-title"><h1>Tasks</h1><p>Today · NJ1</p></div>
      <label className="search-field"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order ID or address" /></label>
      <div className="filter-row" aria-label="Task filters">
        {(['all', 'pickup', 'dropoff', 'local_same_day', 'interstate'] as Filter[]).map((item) => (
          <button key={item} className={filter === item ? 'is-active' : ''} onClick={() => setFilter(item)}>
            {item === 'all' ? 'All' : item === 'local_same_day' ? 'Same Day' : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="task-list">
        {visible.map((task) => (
          <Link key={task.id} to={`/${task.type}/${task.id}`} className="task-card">
            <div className={`task-card-mark task-card-mark--${task.type}`} />
            <div className="task-card-main">
              <span className="task-card-top"><strong>#{task.orderId}</strong><time>{task.time}</time></span>
              <span>{task.address}</span><small>{task.city}</small>
              <div><span className={`task-type task-type--${task.type}`}>{task.type}</span><MovementLabel type={task.movementType} /></div>
            </div>
            <ChevronRight size={20} />
          </Link>
        ))}
      </div>
    </div>
  )
}
