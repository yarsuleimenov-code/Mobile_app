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
  return <>
    <section className="team-order-context" aria-labelledby="order-stop-title">
      <h2 id="order-stop-title">Current stop</h2>
      {tasks.length > 1 ? <label>Order stop<select aria-label="Order stop" value={context.task?.stopId ?? ''} onChange={(event) => onSelectStop(event.target.value)}>
        <option value="">Select stop</option>{tasks.map((task) => <option key={task.stopId} value={task.stopId}>{task.operation === 'pickup' ? 'Pickup' : 'Dropoff'} · Stop {task.sequence} · {task.address}</option>)}
      </select></label> : null}
      <p className="order-stop-meta">{context.task ? `${context.task.operation === 'pickup' ? 'Pickup' : 'Dropoff'} · Stop ${context.task.sequence} · ${context.workDate} · ${context.task.scheduledTime}` : 'Stop not selected / not available'}</p>
      <StopNavigation key={`${context.order}:${context.task?.stopId}:${context.task?.address}`} task={context.task} showContext={false} compact unavailableMessage={tasks.length > 1 ? 'Select a stop to navigate' : 'Address unavailable'} />
      <button className="team-copy-action" type="button" onClick={copy} aria-label={copyState === 'copied' ? 'Order summary copied' : 'Copy order summary'} aria-live="polite"><Copy size={17} aria-hidden="true" /> {copyState === 'copied' ? 'Summary copied' : 'Copy summary'}</button>
      {copyState === 'failed' ? <div className="team-copy-fallback"><p role="alert">Clipboard unavailable. Select and copy the summary below.</p><label>Order summary<textarea readOnly rows={7} value={summary} onFocus={(event) => event.target.select()} /></label></div> : null}
    </section>
    {context.requirements?.trim() ? <section className="order-requirements" aria-labelledby="order-requirements-title"><h2 id="order-requirements-title">Requirements</h2><p>{context.requirements}</p><small>Broker comment</small></section> : null}
    {context.handling ? <section className="order-handling-summary" aria-labelledby="order-handling-title"><h2 id="order-handling-title">Handling requirements</h2><p>{context.handling}</p></section> : null}
    <section className="team-contacts-card" aria-labelledby="team-contacts-title">
    <h2 id="team-contacts-title"><UsersRound size={20} /> Team contacts</h2>
    <ul className="team-contact-list" ref={contactsRef} tabIndex={-1} aria-label="Order team contacts">{teamRoles.map((role) => {
      const contact = team[role]
      const url = contact ? telegramContactUrl(contact.nickname) : undefined
      return <li key={role}><span><small>{role}</small><strong>{contact?.name ?? 'Not assigned'}</strong></span>
        {url ? <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${role} ${contact!.name} on Telegram`}>@{contact!.nickname}</a> : null}
      </li>
    })}</ul>
    </section>
    {context.comment ? <section className="order-note-summary" aria-labelledby="order-note-title"><h2 id="order-note-title">Order note</h2><p>{context.comment}</p></section> : null}
  </>
}
