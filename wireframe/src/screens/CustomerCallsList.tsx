import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { callOrderCandidates, filterCalls, type CustomerCall } from '../callDomain'
import { callPath, formatCallDuration } from '../communicationDomain'
import { useCommunications } from '../communicationStore'
import { useCargo } from '../cargoStore'
import { mockTodaySpokeRoute } from '../spokeDomain'

const callDate = (value: string) => new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

function CallRow({ call }: { call: CustomerCall }) {
  const { threads } = useCommunications()
  const { spokeRoute } = useCargo()
  const route = spokeRoute ?? mockTodaySpokeRoute
  const candidates = callOrderCandidates(call, threads, route.tasks.map((task) => task.externalId))
  const [chosenOrder, setChosenOrder] = useState('')
  const thread = candidates.length === 1 ? candidates[0] : candidates.find((item) => item.orderNumber === chosenOrder)
  const orderNumber = call.orderNumber ?? thread?.orderNumber
  const operation = call.operation ?? thread?.operation
  const routeDate = call.routeDate ?? (route.tasks.some((task) => task.externalId === orderNumber) ? route.workDate : undefined)
  const Icon = call.outcome === 'missed' ? PhoneMissed : call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing
  return <article className={`customer-call-row ${call.outcome === 'missed' ? 'is-missed' : ''}`}>
    <div className="customer-call-heading"><Icon size={21} aria-hidden="true" /><strong>{call.customerName}</strong></div>
    <p>{call.outcome === 'missed' ? 'Missed call' : call.direction === 'inbound' ? 'Incoming call' : 'Outgoing call'}{call.outcome === 'completed' ? ` · ${formatCallDuration(call.duration)}` : call.outcome === 'cancelled' ? ' · Cancelled' : ''}</p>
    <time dateTime={call.startedAt}>Call: {callDate(call.startedAt)}</time>
    <small>{call.customerPhone}</small>
    {candidates.length > 1 ? <label>Choose related order<select value={chosenOrder} onChange={(event) => setChosenOrder(event.target.value)}><option value="">Select order</option>{candidates.map((item) => <option key={item.id} value={item.orderNumber}>#{item.orderNumber} · {item.operation === 'pickup' ? 'Pickup' : 'Delivery'}</option>)}</select></label> : null}
    {orderNumber ? <div className="customer-call-context"><span>{call.orderNumber ? 'Related order' : chosenOrder ? 'Selected order' : 'Suggested order'}: #{orderNumber}{operation ? ` · ${operation === 'pickup' ? 'Pickup' : 'Delivery'}` : ''}</span><span>Route date: {routeDate ?? 'Unavailable'}</span></div> : <p>Related order not identified</p>}
    {orderNumber && thread ? <div className="customer-call-actions"><Link to={`/orders/${orderNumber}/details`}>Open order</Link><Link to={callPath(orderNumber)} aria-label={`Call back ${call.customerName}`}><Phone size={16} /> Call back</Link></div> : <p>{candidates.length ? 'Select a related order to call back.' : 'No matching customer order is available.'}</p>}
  </article>
}

export function CustomerCallsList() {
  const { calls, threads } = useCommunications()
  const { spokeRoute } = useCargo()
  const route = spokeRoute ?? mockTodaySpokeRoute
  const [query, setQuery] = useState('')
  const [missedOnly, setMissedOnly] = useState(false)
  const visible = filterCalls(calls, query, missedOnly, threads, route.tasks.map((task) => task.externalId))
  return <section aria-label="Call history">
    <div className="communication-inbox-tools">
      <label><Search size={19} /><input aria-label="Search calls" placeholder="Customer, phone or order" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <div><button type="button" className={!missedOnly ? 'is-active' : ''} aria-pressed={!missedOnly} onClick={() => setMissedOnly(false)}>All calls <b>{calls.length}</b></button><button type="button" className={missedOnly ? 'is-active' : ''} aria-pressed={missedOnly} onClick={() => setMissedOnly(true)}>Missed <b>{calls.filter((call) => call.outcome === 'missed').length}</b></button></div>
    </div>
    <div className="customer-call-list">{visible.map((call) => <CallRow key={call.id} call={call} />)}</div>
    {!visible.length ? <div className="communication-inbox-empty"><Phone size={28} /><strong>No calls found</strong><p>{query ? 'Try another customer, phone or order.' : missedOnly ? 'There are no missed calls.' : 'Your call history will appear here.'}</p><button type="button" onClick={() => { setQuery(''); setMissedOnly(false) }}>Show all calls</button></div> : null}
  </section>
}
