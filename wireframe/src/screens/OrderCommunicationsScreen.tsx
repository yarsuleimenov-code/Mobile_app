import { AlertCircle, Check, CheckCheck, Clock3, MessageCircleMore, RotateCw, Send, WifiOff } from 'lucide-react'
import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { communicationDayLabel, CORPORATE_SMS_NUMBER_LABEL, type SmsMessage } from '../communicationDomain'
import { useCommunications } from '../communicationStore'
import { useCargo } from '../cargoStore'
import { operationalName } from '../orderDetailsDomain'
import { usePrototypeScenario } from '../prototypeScenarioStore'
import { mockTodaySpokeRoute, spokeTaskPath } from '../spokeDomain'

const statusMeta: Record<SmsMessage['status'], { label: string; icon: typeof Check }> = {
  queued: { label: 'Queued until online', icon: Clock3 },
  sending: { label: 'Sending', icon: Clock3 },
  sent: { label: 'Sent', icon: CheckCheck },
  failed: { label: 'Not sent', icon: AlertCircle },
  received: { label: 'Received', icon: Check },
}
const quickMessages = ['On my way', 'Arrived', 'Running late', 'Please confirm access']
const messageTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
const maskedPhone = (value: string) => `••• ${value.replace(/\D/g, '').slice(-4)}`

export function OrderCommunicationsScreen() {
  const { orderNumber = '' } = useParams()
  const { getThread, sendMessage, retryMessage, markRead } = useCommunications()
  const { getOrderDetails, spokeRoute } = useCargo()
  const { network } = usePrototypeScenario()
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const thread = getThread(orderNumber)
  const route = spokeRoute ?? mockTodaySpokeRoute
  const task = route.tasks.find((item) => item.externalId === orderNumber)
  const orderTitle = operationalName(getOrderDetails(orderNumber), orderNumber)
  const lastOutbound = thread ? [...thread.messages].reverse().find((message) => message.direction === 'outbound') : undefined

  useEffect(() => { markRead(orderNumber) }, [markRead, orderNumber])
  useEffect(() => {
    window.requestAnimationFrame(() => window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    }))
  }, [lastOutbound?.status, thread?.messages.length])

  if (!thread) return <div className="cargo-flow"><CargoFlowHeader title="Messages" subtitle={`Order #${orderNumber}`} /><main className="message-empty"><MessageCircleMore size={38} /><h2>No customer conversation</h2><p>This order does not have a customer contact.</p><Link to="/communications">Open all messages</Link></main><CargoBottomNav /></div>

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.trim()) return
    sendMessage(orderNumber, draft)
    setDraft('')
  }
  const useQuickMessage = (message: string) => {
    setDraft(message)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  return <div className="cargo-flow message-flow">
    <CargoFlowHeader title={thread.customerName} subtitle={`Order #${orderNumber} · ${thread.operation === 'pickup' ? 'Pickup' : 'Dropoff'}`} />
    <main className="message-thread-screen">
      <section className="message-order-context">
        <div><strong>{orderTitle}</strong><span>{task?.address ?? 'Order address unavailable'}</span></div>
        <Link to={task ? spokeTaskPath(task, route.workDate) : `/orders/${orderNumber}/details`}>Open order</Link>
      </section>
      <section className="message-sender-identity">
        <MessageCircleMore size={19} />
        <div><small>Corporate conversation</small><p><strong>{CORPORATE_SMS_NUMBER_LABEL}</strong><span aria-hidden="true">→</span><strong>{thread.customerName} {maskedPhone(thread.customerPhone)}</strong></p></div>
      </section>
      {network === 'offline' ? <div className="message-offline-banner" role="status"><WifiOff size={18} /><span><strong>Offline</strong><small>Messages will send automatically when connection returns.</small></span></div> : null}
      <ol className="message-bubbles" aria-label={`Messages with ${thread.customerName}`} aria-live="polite" aria-relevant="additions text">
        {thread.messages.map((message, index) => {
          const meta = statusMeta[message.status]
          const StatusIcon = meta.icon
          const day = communicationDayLabel(message.createdAt)
          const previousDay = index ? communicationDayLabel(thread.messages[index - 1].createdAt) : ''
          return <Fragment key={message.id}>
            {day !== previousDay ? <li className="message-date-divider"><span>{day}</span></li> : null}
            <li className={`message-bubble message-bubble--${message.direction} message-bubble--${message.status}`}>
              <p>{message.body}</p>
              <span><time>{messageTime(message.createdAt)}</time>{message.direction === 'outbound' ? <><StatusIcon size={14} /> {meta.label}</> : null}</span>
              {message.status === 'failed' ? <div className="message-retry"><small>Message not sent. Check connection and retry.</small><button type="button" onClick={() => retryMessage(orderNumber, message.id)}><RotateCw size={15} /> Retry</button></div> : null}
            </li>
          </Fragment>
        })}
        <li className="message-scroll-anchor" aria-hidden="true" />
      </ol>
      <span className="visually-hidden" role="status" aria-live="polite">{lastOutbound ? `Message ${statusMeta[lastOutbound.status].label}` : ''}</span>
      <form className="message-composer" onSubmit={submit}>
        <div className="message-quick-replies" aria-label="Quick messages">{quickMessages.map((message) => <button type="button" key={message} onClick={() => useQuickMessage(message)}>{message}</button>)}</div>
        <label htmlFor="customer-message">Message customer</label>
        <div className="message-composer-row"><textarea ref={textareaRef} id="customer-message" rows={1} maxLength={320} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type an SMS message" /><button type="submit" disabled={!draft.trim()} aria-label="Send message"><Send size={21} /></button></div>
        <small>{network === 'offline' ? 'Will send when online' : `Sent from ${CORPORATE_SMS_NUMBER_LABEL}`} · {draft.length}/320</small>
      </form>
    </main>
    <CargoBottomNav />
  </div>
}
