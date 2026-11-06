import { MessageCircleMore, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { calculatePieces, normalizeOrderNumber } from '../cargoDomain'
import { communicationPath } from '../communicationDomain'
import { useCommunications } from '../communicationStore'
import { useCargo } from '../cargoStore'
import { canEditInternalName, operationalName, orderDetailsIssues, specialCargoLabels, type OrderDetailsEdit } from '../orderDetailsDomain'
import { usePrototypeScenario } from '../prototypeScenarioStore'
import { mockTodaySpokeRoute, productLines, spokeTaskPath, spokeOperationLabels } from '../spokeDomain'
import { TeamContactsCard } from '../TeamContactsCard'
import { orderContextTasks } from '../teamContactsDomain'
import { getOrderRequirements } from '../orderRequirements'
import { getOrderReferenceData } from '../orderReferenceData'
import { ReferencePhotoGallery } from '../ReferencePhotoGallery'
import { PackingPhotos } from '../PackingPhotos'

export function OrderDetailsScreen() {
  const { orderNumber = '' } = useParams()
  const [params] = useSearchParams()
  return <OrderDetailsForm key={`${orderNumber}:${params}`} order={normalizeOrderNumber(orderNumber)} />
}
function OrderDetailsForm({ order }: { order: string }) {
  const { getOrderDetails, saveOrderDetails, getOrderCargo, spokeRoute } = useCargo()
  const { getThread } = useCommunications()
  const { role, network } = usePrototypeScenario()
  const current = getOrderDetails(order)
  const cargo = getOrderCargo(order)
  const route = spokeRoute ?? mockTodaySpokeRoute
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    if (params.get('focus') !== 'team') window.scrollTo({ top: 0 })
  }, [params])
  const operation = params.get('operation') === 'pickup' ? 'pickup' : params.get('operation') === 'dropoff' ? 'dropoff' : undefined
  const tasks = orderContextTasks(route.tasks, order, operation)
  const matching = orderContextTasks(tasks, order, operation, params.get('stop') || undefined)
  const task = matching.length === 1 ? matching[0] : undefined
  const referenceKey = `zaberman-order-reference:v1:${order}`
  const [refreshed, setRefreshed] = useState(() => {
    try { return localStorage.getItem(referenceKey) === 'latest' }
    catch { return false }
  })
  const [refreshMessage, setRefreshMessage] = useState('')
  const [edit, setEdit] = useState<OrderDetailsEdit>(() => ({ internal_name: current.internal_name,
    special_cargo_type: current.special_cargo_type, special_cargo_details: current.special_cargo_details }))
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const canName = canEditInternalName(role, current)
  const canSpecial = role === 'dispatcher'
  const showEditors = role === 'dispatcher' || role === 'supervisor'
  const issues = orderDetailsIssues({ ...current, ...edit })
  const quantity = cargo ? calculatePieces(cargo.dimensionGroups) : null
  const thread = getThread(order)
  const name = operationalName(current, order, task?.title)
  const products = productLines(task?.products)
  const requirements = getOrderRequirements(order)
  const reference = getOrderReferenceData(order, refreshed)
  const refreshOrder = () => {
    const latest = getOrderReferenceData(order, true)
    if (latest.photos.length === reference.photos.length) {
      setRefreshMessage('Order is up to date.')
      return
    }
    try {
      localStorage.setItem(referenceKey, 'latest')
      setRefreshed(true)
      setRefreshMessage('Order refreshed. New reference photo available.')
    } catch {
      setRefreshMessage('Could not refresh order. Try again.')
    }
  }
  const change = (patch: Partial<OrderDetailsEdit>) => { setEdit((value) => ({ ...value, ...patch })); setMessage('') }
  const save = () => {
    try {
      saveOrderDetails(order, edit)
      setEdit({ ...edit, internal_name: edit.internal_name.trim(), special_cargo_details: edit.special_cargo_details.trim() })
      setError(false); setMessage('Order details saved')
    } catch (cause) {
      setError(true); setMessage(cause instanceof Error && cause.message.includes('role') ? cause.message : 'Could not save order details. Keep this page open and try again.')
    }
  }
  return <div className="cargo-flow">
    <CargoFlowHeader title="Order details" subtitle={`Order #${order}`} />
    <main className="pickup-form order-details-body">
      <section className="order-name-summary"><strong>{name}</strong><span>Places <b>{quantity ?? '—'}</b></span></section>
      <section className="order-detail-card order-reference-card" aria-labelledby="product-list-title">
        <h2 id="product-list-title">Product List</h2>
        {products.length ? <ul>{products.map((product, index) => <li key={`${index}:${product}`}>{product}</li>)}</ul> : <p>Product list unavailable.</p>}
      </section>
      {requirements || reference.coi || reference.brokerComment ? (
        <section className="order-requirements" aria-labelledby="order-requirements-title">
          <h2 id="order-requirements-title">Requirements</h2>
          {requirements ? <p>{requirements}</p> : null}
          {reference.coi ? <div><h3>COI</h3><p>{reference.coi}</p></div> : null}
          {reference.brokerComment ? <div><h3>Broker comment</h3><p>{reference.brokerComment}</p></div> : null}
        </section>
      ) : null}
      <section className="order-detail-card order-reference-card" aria-labelledby="reference-photos-title">
        <div className="reference-photo-heading">
          <h2 id="reference-photos-title">Reference photos</h2>
          <button type="button" className="ebol-secondary" onClick={refreshOrder} disabled={network === 'offline'}><RefreshCw size={16} aria-hidden="true" /> Refresh order</button>
        </div>
        {network === 'offline' ? <p>Connect to the internet to refresh the order.</p> : null}
        {refreshMessage ? <p role="status">{refreshMessage}</p> : null}
        <ReferencePhotoGallery photos={reference.photos} />
      </section>
      <PackingPhotos order={order} />
      <TeamContactsCard context={{ order, name, quantity, task, workDate: route.workDate,
        handling: current.special_cargo_type ? `${specialCargoLabels[current.special_cargo_type]} · ${current.special_cargo_details}` : '', comment: cargo?.orderComment ?? '', requirements }}
        tasks={tasks} focusContacts={params.get('focus') === 'team'} onSelectStop={(stopId) => { const next = new URLSearchParams(params); next.delete('focus'); if (stopId) next.set('stop', stopId); else next.delete('stop'); setParams(next, { replace: true }) }} />
      {showEditors ? <><section className="order-detail-card">
        <h2>Names</h2>
        <dl className="order-detail-values"><div><dt>External name</dt><dd>{current.trade_name || 'Not received'}</dd></div><div><dt>Source</dt><dd>{current.name_source} · read-only</dd></div></dl>
        <label>Internal name<input maxLength={80} value={edit.internal_name} readOnly={!canName} onChange={(event) => change({ internal_name: event.target.value })} placeholder="Short operational name" /></label>
        <small>{edit.internal_name.length}/80 · Used in tasks and labels. Quantity is a separate field.</small>
        <p className="order-role-note">{canName ? role === 'supervisor' ? 'You may fill a missing name once. Further changes require a dispatcher.' : 'Dispatcher can edit the internal name and Special Cargo.' : 'Internal name changes require a dispatcher. Supervisor may fill a missing name.'}</p>
      </section>
      <section className="order-detail-card">
        <h2>Special Cargo</h2>
        <label>Handling type<select disabled={!canSpecial} value={edit.special_cargo_type} onChange={(event) => change({ special_cargo_type: event.target.value as OrderDetailsEdit['special_cargo_type'] })}>
          {Object.entries(specialCargoLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        {edit.special_cargo_type ? <label>Handling details<textarea rows={3} maxLength={1000} readOnly={!canSpecial} value={edit.special_cargo_details} onChange={(event) => change({ special_cargo_details: event.target.value })} /></label> : null}
        <small>Handling requirements do not replace the cargo name.</small>
      </section>
      </> : <details className="order-additional-details">
        <summary>Additional details</summary>
        <dl className="order-detail-values"><div><dt>External name</dt><dd>{current.trade_name || 'Not received'}</dd></div><div><dt>Source</dt><dd>{current.name_source}</dd></div></dl>
      </details>}
      {issues.length ? <div className="measurement-warning" role="status"><strong>Order data incomplete</strong>{issues.map((issue) => <p key={issue}>{issue}</p>)}{showEditors ? <p>You can save now and complete these fields later.</p> : null}</div> : null}
      {canName || canSpecial ? <button type="button" className="cargo-primary" onClick={save}>Save order details</button> : null}
      {message ? <p role={error ? 'alert' : 'status'} className={error ? 'ebol-storage-warning' : 'order-save-success'}>{message}</p> : null}
      <details className={`${showEditors ? 'order-detail-card' : 'order-additional-details'} spoke-preview`}>
        <summary>Spoke preview <small>Read-only</small></summary>
        {task ? <><p>Outbound order fields</p><dl className="order-detail-values">
          <div><dt>Name</dt><dd>{operationalName(current, order)}</dd></div>
          <div><dt>Quantity</dt><dd>{quantity ?? '—'} pcs</dd></div>
          <div><dt>Address</dt><dd>{task.address}</dd></div>
          <div><dt>Time</dt><dd>{route.workDate} · {task.scheduledTime}</dd></div>
          <div><dt>Comment</dt><dd>{cargo?.orderComment || 'No comment'}</dd></div>
        </dl></> : <p>This order has no stop in the current route.</p>}
      </details>
      <details className={`${showEditors ? 'order-detail-card' : 'order-additional-details'} order-data-history`}><summary>Order change history ({current.history.length})</summary>
        {current.history.length ? <ol>{[...current.history].reverse().map((entry, index) => <li key={`${entry.at}-${index}`}><strong>{entry.field.replaceAll('_', ' ')}</strong><span>{entry.before || '(empty)'} → {entry.after || '(empty)'}</span><small>{entry.role} · {new Date(entry.at).toLocaleString()}</small></li>)}</ol> : <p>No order data changes yet.</p>}
      </details>
      {showEditors ? <p className="order-role-note">Changes apply to current order data. Previously signed document versions remain unchanged.</p> : null}
      <Link className="order-message-action" to={communicationPath(order)}><MessageCircleMore size={19} /><span><strong>Message customer</strong><small>{thread?.customerName ?? 'Customer contact'} · {thread?.unreadCount ? `${thread.unreadCount} unread` : 'Corporate SMS'}</small></span></Link>
      <Link className="ebol-secondary" to={task ? spokeTaskPath(task, route.workDate) : `/${operation === 'dropoff' ? 'dropoff' : 'pickup'}?order=${order}`}>Open {spokeOperationLabels[task?.operation ?? operation ?? 'pickup']}</Link>
    </main><CargoBottomNav />
  </div>
}
