import { ChevronRight, MessageCircleMore, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import {
  communicationDayLabel,
  communicationPath,
  CORPORATE_SMS_NUMBER_LABEL,
  filterCommunicationThreads,
  latestMessage,
  type CommunicationThread,
} from '../communicationDomain'
import { useCommunications } from '../communicationStore'

const time = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function CommunicationsScreen() {
  const { threads, unreadTotal } = useCommunications()
  const [query, setQuery] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const groups = useMemo(() => {
    const visible = filterCommunicationThreads(threads, query, unreadOnly)
      .sort((left, right) => (latestMessage(right)?.createdAt ?? '').localeCompare(latestMessage(left)?.createdAt ?? ''))
    return visible.reduce<Array<{ label: string; threads: CommunicationThread[] }>>((result, thread) => {
      const label = communicationDayLabel(latestMessage(thread)?.createdAt ?? new Date().toISOString())
      const current = result.at(-1)
      if (current?.label === label) current.threads.push(thread)
      else result.push({ label, threads: [thread] })
      return result
    }, [])
  }, [query, threads, unreadOnly])
  const visibleCount = groups.reduce((total, group) => total + group.threads.length, 0)

  return <CargoShell>
    <div className="communications-list-screen">
      <header className="communications-title">
        <span><MessageCircleMore size={25} /></span>
        <div><h1>Messages</h1><p>{unreadTotal ? `${unreadTotal} unread customer messages` : 'Customer conversations by order'}</p></div>
      </header>
      <div className="corporate-sender"><strong>Corporate SMS</strong><span>{CORPORATE_SMS_NUMBER_LABEL}</span></div>
      <section className="communication-inbox-tools" aria-label="Message filters">
        <label><Search size={19} /><input aria-label="Search customer messages" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order, customer or message" /></label>
        <div>
          <button type="button" className={!unreadOnly ? 'is-active' : ''} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>All <b>{threads.length}</b></button>
          <button type="button" className={unreadOnly ? 'is-active' : ''} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread <b>{unreadTotal}</b></button>
        </div>
      </section>
      {groups.length ? groups.map((group) => <section className="communication-day-group" key={group.label}>
        <h2>{group.label}<span>{group.threads.length}</span></h2>
        <div className="communication-thread-list">
          {group.threads.map((thread) => {
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
      </section>) : <div className="communication-inbox-empty"><MessageCircleMore size={28} /><strong>No conversations found</strong><p>{unreadOnly ? 'There are no unread customer messages.' : `No results for “${query.trim()}”.`}</p><button type="button" onClick={() => { setQuery(''); setUnreadOnly(false) }}>Show all messages</button></div>}
      {visibleCount ? <p className="communication-result-count">{visibleCount} conversation{visibleCount === 1 ? '' : 's'} shown</p> : null}
    </div>
  </CargoShell>
}
