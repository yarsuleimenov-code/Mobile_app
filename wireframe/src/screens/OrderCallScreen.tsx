import { MessageCircleMore, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { communicationPath, CORPORATE_SMS_NUMBER_LABEL, formatCallDuration } from '../communicationDomain'
import { useCommunications } from '../communicationStore'

type CallStatus = 'ready' | 'calling' | 'connected' | 'ended'

const statusContent: Record<CallStatus, { title: string; detail: string }> = {
  ready: { title: 'Ready to call', detail: 'Confirm the customer and order before starting.' },
  calling: { title: 'Calling…', detail: 'Waiting for the customer to answer.' },
  connected: { title: 'Connected', detail: 'Call in progress' },
  ended: { title: 'Call ended', detail: 'The call has been completed.' },
}

const maskedPhone = (value: string) => `••• ${value.replace(/\D/g, '').slice(-4)}`

export function OrderCallScreen() {
  const { orderNumber = '' } = useParams()
  const { getThread } = useCommunications()
  const thread = getThread(orderNumber)
  const [status, setStatus] = useState<CallStatus>('ready')
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)

  useEffect(() => {
    if (status !== 'calling') return
    const timeout = window.setTimeout(() => setStatus('connected'), 1400)
    return () => window.clearTimeout(timeout)
  }, [status])

  useEffect(() => {
    if (status !== 'connected') return
    const interval = window.setInterval(() => setDuration((value) => value + 1), 1000)
    return () => window.clearInterval(interval)
  }, [status])

  if (!thread) return <div className="cargo-flow"><CargoFlowHeader title="Customer call" subtitle={`Order #${orderNumber}`} /><main className="message-empty"><Phone size={38} /><h2>No customer contact</h2><p>This order does not have a phone number.</p><Link to="/communications">Open messages</Link></main><CargoBottomNav /></div>

  const startCall = () => {
    setDuration(0)
    setMuted(false)
    setSpeaker(false)
    setStatus('calling')
  }

  const currentStatus = statusContent[status]
  const active = status === 'calling' || status === 'connected'

  return <div className="cargo-flow call-flow">
    <CargoFlowHeader title="Customer call" subtitle={`Order #${orderNumber}`} />
    <main className={`call-screen call-screen--${status}`}>
      <section className="call-contact" aria-live="polite">
        <div className={`call-avatar ${active ? 'is-active' : ''}`} aria-hidden="true"><Phone size={31} /></div>
        <p className={`call-state call-state--${status}`}>{currentStatus.title}</p>
        <h1>{thread.customerName}</h1>
        <p className="call-phone">{maskedPhone(thread.customerPhone)}</p>
        <p className="call-detail">{status === 'connected' || status === 'ended' ? `${currentStatus.detail} · ${formatCallDuration(duration)}` : currentStatus.detail}</p>
      </section>

      <section className="call-identity">
        <span><small>Calling from</small><strong>{CORPORATE_SMS_NUMBER_LABEL}</strong></span>
        <span><small>Related order</small><strong>#{orderNumber} · {thread.operation === 'pickup' ? 'Pickup' : 'Dropoff'}</strong></span>
      </section>

      {status === 'connected' ? <div className="call-controls" aria-label="Call controls">
        <button type="button" className={muted ? 'is-active' : ''} onClick={() => setMuted((value) => !value)} aria-pressed={muted}>{muted ? <MicOff /> : <Mic />}<span>{muted ? 'Unmute' : 'Mute'}</span></button>
        <button type="button" className={speaker ? 'is-active' : ''} onClick={() => setSpeaker((value) => !value)} aria-pressed={speaker}><Volume2 /><span>Speaker</span></button>
      </div> : null}

      <div className="call-primary-actions">
        {active
          ? <button type="button" className="call-end-button" onClick={() => setStatus('ended')}><PhoneOff size={22} /> End call</button>
          : <button type="button" className="call-start-button" onClick={startCall}><Phone size={22} /> {status === 'ended' ? 'Call again' : 'Start call'}</button>}
        <Link to={communicationPath(orderNumber)}><MessageCircleMore size={18} /> Back to messages</Link>
      </div>
    </main>
    <CargoBottomNav />
  </div>
}
