import { Copy, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getOrderTeam, orderSummaryText, teamRoles, telegramContactUrl, type TeamOrderContext } from './teamContactsDomain'
import type { SpokeTask } from './spokeDomain'
import { StopNavigation } from './StopNavigation'

export function TeamContactsCard({ context, tasks, onSelectStop, focusContacts = false }: {
  context: TeamOrderContext; tasks: SpokeTask[]; onSelectStop: (stopId: string) => void; focusContacts?: boolean
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const contactsRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    if (focusContacts) {
      contactsRef.current?.scrollIntoView({ block: 'center' })
      contactsRef.current?.focus({ preventScroll: true })
    }
  }, [focusContacts])
  const team = getOrderTeam(context.order)
  const summary = orderSummaryText(context)
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary); setCopyState('copied') }
    catch { setCopyState('failed') }
  }
  return <section className="order-detail-card team-contacts-card" aria-labelledby="team-contacts-title">
    <h2 id="team-contacts-title"><UsersRound size={21} /> Team contacts</h2>
    <div className="team-order-context">
      <strong>Order #{context.order} · {context.name}</strong>
      {tasks.length > 1 ? <label>Order stop<select value={context.task?.stopId ?? ''} onChange={(event) => onSelectStop(event.target.value)}>
        <option value="">Select stop</option>{tasks.map((task) => <option key={task.stopId} value={task.stopId}>{task.operation === 'pickup' ? 'Pickup' : 'Dropoff'} · Stop {task.sequence} · {task.address}</option>)}
      </select></label> : null}
      <dl className="order-detail-values">
        <div><dt>Operation / stop</dt><dd>{context.task ? `${context.task.operation === 'pickup' ? 'Pickup' : 'Dropoff'} · Stop ${context.task.sequence}` : 'Not selected / not available'}</dd></div>
        <div className="team-context-wide"><dt>Address</dt><dd><StopNavigation key={`${context.order}:${context.task?.stopId}:${context.task?.address}`} task={context.task} showContext={false} unavailableMessage={tasks.length > 1 ? 'Select a stop to navigate' : 'Address unavailable'} /></dd></div>
        {context.task ? <div><dt>Scheduled</dt><dd>{context.workDate} · {context.task.scheduledTime}</dd></div> : null}
        <div><dt>Quantity</dt><dd>{context.quantity === null ? 'Not recorded' : `${context.quantity} pcs`}</dd></div>
        {context.handling ? <div className="team-context-wide"><dt>Handling</dt><dd>{context.handling}</dd></div> : null}
        {context.comment ? <div className="team-context-wide"><dt>Order note</dt><dd>{context.comment}</dd></div> : null}
      </dl>
      <button className="ebol-secondary team-copy-action" type="button" onClick={copy} aria-live="polite"><Copy size={17} /> {copyState === 'copied' ? 'Order summary copied' : 'Copy order summary'}</button>
      {copyState === 'failed' ? <div className="team-copy-fallback"><p role="alert">Clipboard unavailable. Select and copy the summary below.</p><label>Order summary<textarea readOnly rows={7} value={summary} onFocus={(event) => event.target.select()} /></label></div> : null}
    </div>
    <ul className="team-contact-list" ref={contactsRef} tabIndex={-1} aria-label="Order team contacts">{teamRoles.map((role) => {
      const contact = team[role]
      const url = contact ? telegramContactUrl(contact.nickname) : undefined
      return <li key={role}><span><small>{role}</small><strong>{contact?.name ?? 'Not assigned'}</strong></span>
        {url ? <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${role} ${contact!.name} on Telegram`}>@{contact!.nickname}</a> : null}
      </li>
    })}</ul>
  </section>
}
