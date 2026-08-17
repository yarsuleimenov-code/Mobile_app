import { ArrowDown, ArrowUp, ChevronRight, PackageCheck, Route } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { MovementLabel, RouteLine, SectionHeading } from '../components'
import { tasks } from '../data'
import { useDemo } from '../store'

export function HomeScreen() {
  const navigate = useNavigate()
  const { role } = useDemo()
  const canOperate = ['warehouse', 'driver', 'delivery', 'supervisor'].includes(role)
  return (
    <div className="home-screen">
      <section className="quick-actions" aria-label="Start an operation">
        <button className="quick-action quick-action--pickup" disabled={!canOperate} onClick={() => navigate('/pickup/PU-101')}>
          <PackageCheck size={40} strokeWidth={1.8} />
          <span>Start Pickup</span>
          <small>Collect and label</small>
          <ArrowUp size={19} />
        </button>
        <button className="quick-action quick-action--dropoff" disabled={!canOperate} onClick={() => navigate('/dropoff/DO-102')}>
          <PackageCheck size={40} strokeWidth={1.8} />
          <span>Start Dropoff</span>
          <small>Deliver and confirm</small>
          <ArrowDown size={19} />
        </button>
      </section>
      {!canOperate ? <p className="permission-note">Your current role can monitor tasks, but cannot start field operations.</p> : null}

      <Link to="/routes/SD-2408" className="same-day-card">
        <div className="same-day-route"><RouteLine active={1} count={4} /></div>
        <div>
          <span className="same-day-title"><Route size={19} /> Same Day route</span>
          <strong>3 of 6 stops</strong>
          <small>NJ1 · Crew 12 · Van 08</small>
          <span className="link-label">Continue route <ChevronRight size={18} /></span>
        </div>
      </Link>

      <section className="task-preview">
        <SectionHeading title="Next tasks" action="View all" onAction={() => navigate('/tasks')} />
        <div className="task-rail">
          {tasks.map((task, index) => (
            <Link key={task.id} to={`/${task.type}/${task.id}`} className="task-row">
              <span className={`rail-node rail-node--${task.type} ${index < 1 ? 'is-done' : ''}`} />
              <span className="task-row-main">
                <strong>#{task.orderId}</strong>
                <span>{task.address}</span>
                <small>{task.city}</small>
              </span>
              <span className="task-row-side">
                <time>{task.time}</time>
                <span className={`task-type task-type--${task.type}`}>{task.type === 'pickup' ? 'Pickup' : 'Dropoff'}</span>
                <MovementLabel type={task.movementType} />
              </span>
              <ChevronRight size={20} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
