import { ChevronRight, MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { communicationPath, CORPORATE_SMS_NUMBER_LABEL, latestMessage } from '../communicationDomain'
import { useCommunications } from '../communicationStore'

const time = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function CommunicationsScreen() {
  const { threads, unreadTotal } = useCommunications()
  const sorted = [...threads].sort((left, right) => (latestMessage(right)?.createdAt ?? '').localeCompare(latestMessage(left)?.createdAt ?? ''))

  return <CargoShell>
    <div className="communications-list-screen">
      <header className="communications-title">
        <span><MessageCircleMore size={25} /></span>
        <div><h1>Messages</h1><p>{unreadTotal ? `${unreadTotal} unread customer messages` : 'Customer conversations by order'}</p></div>
      </header>
      <div className="corporate-sender"><strong>Corporate SMS</strong><span>{CORPORATE_SMS_NUMBER_LABEL}</span></div>
      <div className="communication-thread-list">
        {sorted.map((thread) => {
          const last = latestMessage(thread)
          return <Link to={communicationPath(thread.orderNumber)} key={thread.id} className={thread.unreadCount ? 'has-unread' : ''}>
            <span className="communication-avatar">{thread.customerName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
            <span className="communication-thread-main">
              <span><strong>{thread.customerName}</strong><time>{last ? time(last.createdAt) : ''}</time></span>
              <small>Order #{thread.orderNumber} · {thread.operation === 'pickup' ? 'Pickup' : 'Dropoff'}</small>
              <p>{last?.body ?? 'No messages yet'}</p>
            </span>
            {thread.unreadCount ? <b className="message-unread" aria-label={`${thread.unreadCount} unread`}>{thread.unreadCount}</b> : <ChevronRight size={19} />}
          </Link>
        })}
      </div>
    </div>
  </CargoShell>
}
