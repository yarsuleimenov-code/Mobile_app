import type { ReactNode } from 'react'
import { productLines, spokeOperationLabels, type SpokeOperation, type SpokeTask } from './spokeDomain'

export function OrderStopSummary({ order, name, operation, task, plannedDate, actions, children }: {
  order: string
  name: string
  operation: SpokeOperation
  task?: SpokeTask
  plannedDate?: string
  actions: ReactNode
  children?: ReactNode
}) {
  const items = productLines(task?.products)
  const notes = task?.notes?.trim()
  const orderLabel = `Order #${order}`

  return (
    <section className="order-stop-summary" aria-label="Order summary">
      <div className="order-stop-title">
        <h2>{name}</h2>
        {name !== orderLabel ? <span>#{order}</span> : null}
      </div>
      <p className="order-stop-plan">
        <b className={`spoke-task-operation spoke-task-operation--${operation}`}>{spokeOperationLabels[operation]}</b>
        {plannedDate && task ? <span>Planned {plannedDate} · {task.scheduledTime} · Stop {task.sequence}</span> : null}
      </p>
      <div>
        <h3>Items</h3>
        {items.length ? <ul>{items.map((item, index) => <li key={`${index}:${item}`}>{item}</li>)}</ul> : <p>Item list unavailable</p>}
      </div>
      {notes ? <div><h3>{spokeOperationLabels[operation]} Notes</h3><p>{notes}</p></div> : null}
      {children}
      <div className="order-summary-actions">{actions}</div>
    </section>
  )
}
