import { AlertCircle, Check, CheckCheck, Clock3, MessageCircleMore, RotateCw, Send } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { CORPORATE_SMS_NUMBER_LABEL, type SmsMessage } from '../communicationDomain'
import { useCommunications } from '../communicationStore'
import { useCargo } from '../cargoStore'
import { operationalName } from '../orderDetailsDomain'
import { mockTodaySpokeRoute, spokeTaskPath } from '../spokeDomain'

const statusMeta: Record<SmsMessage['status'], { label: string; icon: typeof Check }> = {
  queued: { label: 'Queued until online', icon: Clock3 },
  sending: { label: 'Sending', icon: Clock3 },
  sent: { label: 'Sent', icon: CheckCheck },
  failed: { label: 'Not sent', icon: AlertCircle },
  received: { label: 'Received', icon: Check },
}

const messageTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function OrderCommunicationsScreen() {
  const { orderNumber = '' } = useParams()
  const { getThread, sendMessage, retryMessage, markRead } = useCommunications()
  const { getOrderDetails, spokeRoute } = useCargo()
  const [draft, setDraft] = useState('')
  const thread = getThread(orderNumber)
  const route = spokeRoute ?? mockTodaySpokeRoute
  const task = route.tasks.find((item) => item.externalId === orderNumber)
  const orderTitle = useMemo(() => operationalName(getOrderDetails(orderNumber), orderNumber), [getOrderDetails, orderNumber])

  useEffect(() => { markRead(orderNumber) }, [markRead, orderNumber])

  if (!thread) return <div className="cargo-flow"><CargoFlowHeader title="Messages" subtitle={`Order #${orderNumber}`} /><main className="message-empty"><MessageCircleMore size={38} /><h2>No customer conversation</h2><p>This order does not have a mock customer contact.</p><Link to="/communications">Open all messages</Link></main><CargoBottomNav /></div>

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) return
    sendMessage(orderNumber, draft)
    setDraft('')
  }

  return <div className="cargo-flow message-flow">
    <CargoFlowHeader title={thread.customerName} subtitle={`Order #${orderNumber} · ${thread.operation === 'pickup' ? 'Pickup' : 'Dropoff'}`} />
    <main className="message-thread-screen">
      <section className="message-order-context">
        <div><strong>{orderTitle}</strong><span>{task?.address ?? 'Order address unavailable'}</span></div>
        <Link to={task ? spokeTaskPath(task, route.workDate) : `/orders/${orderNumber}/details`}>Open order</Link>
      </section>
      <section className="message-sender-identity">
        <MessageCircleMore size={18} />
        <span><small>Sending from Zaberman</small><strong>{CORPORATE_SMS_NUMBER_LABEL}</strong></span>
        <span><small>Customer</small><strong>{thread.customerPhone}</strong></span>
      </section>
      <ol className="message-bubbles" aria-label={`Messages with ${thread.customerName}`}>
        {thread.messages.map((message) => {
          const meta = statusMeta[message.status]
          const StatusIcon = meta.icon
          return <li key={message.id} className={`message-bubble message-bubble--${message.direction} message-bubble--${message.status}`}>
            <p>{message.body}</p>
            <span><time>{messageTime(message.createdAt)}</time>{message.direction === 'outbound' ? <><StatusIcon size={13} /> {meta.label}</> : null}</span>
            {message.status === 'failed' ? <button type="button" onClick={() => retryMessage(orderNumber, message.id)}><RotateCw size={14} /> Retry</button> : null}
          </li>
        })}
      </ol>
      <form className="message-composer" onSubmit={submit}>
        <label htmlFor="customer-message">Message customer</label>
        <div><textarea id="customer-message" rows={2} maxLength={320} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type an SMS message" /><button type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={20} /></button></div>
        <small>{draft.length}/320 · Sent from {CORPORATE_SMS_NUMBER_LABEL}</small>
      </form>
    </main>
    <CargoBottomNav />
  </div>
}
