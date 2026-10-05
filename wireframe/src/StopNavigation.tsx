import { Check, Copy, Navigation } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCargo } from './cargoStore'
import { googleMapsDirectionsUrl } from './externalNavigationDomain'
import { mockTodaySpokeRoute, type SpokeOperation, type SpokeTask } from './spokeDomain'
import { orderContextTasks, teamContactsPath } from './teamContactsDomain'

export function StopNavigation({ task, blockedMessage, beforeNavigate, unavailableMessage = 'Address unavailable', showContext = true, compact = false }: {
  task?: SpokeTask; blockedMessage?: string; beforeNavigate?: () => boolean; unavailableMessage?: string; showContext?: boolean; compact?: boolean
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [saveFailed, setSaveFailed] = useState(false)
  const address = task?.address.trim() ?? ''
  const url = googleMapsDirectionsUrl(address)
  const separator = address.indexOf(',')
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setCopyState('copied') }
    catch { setCopyState('failed') }
  }
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (beforeNavigate && !beforeNavigate()) { event.preventDefault(); setSaveFailed(true) }
    else setSaveFailed(false)
  }
  return <section className={`stop-navigation${compact ? ' stop-navigation-compact' : ''}`} aria-label={task ? `Directions for ${task.operation} stop ${task.sequence}, order ${task.externalId}` : 'Stop directions'}>
    {task && showContext && !compact ? <small>{task.operation === 'pickup' ? 'Pickup' : 'Dropoff'} · Stop {task.sequence} · {task.scheduledTime}</small> : null}
    <p className="stop-navigation-address">{separator >= 0 ? <>{address.slice(0, separator + 1)}<br />{address.slice(separator + 1).trim()}</> : address || unavailableMessage}</p>
    {url ? <><div className="stop-navigation-actions">
      {blockedMessage ? <button type="button" disabled aria-label={`Navigate unavailable: ${blockedMessage}`} title={blockedMessage}><Navigation size={compact ? 20 : 18} aria-hidden="true" />{!compact ? 'Navigate' : null}</button> : <a href={url} target="_blank" rel="noopener noreferrer" onClick={open} aria-label={`Navigate to ${address}`} title="Navigate · Google Maps"><Navigation size={compact ? 20 : 18} aria-hidden="true" />{!compact ? 'Navigate' : null}</a>}
      <button className="address-copy-action" type="button" onClick={copy} aria-label={compact ? copyState === 'copied' ? 'Address copied' : 'Copy address' : undefined} title={copyState === 'copied' ? 'Address copied' : 'Copy address'} aria-live="polite">{copyState === 'copied' && compact ? <Check size={20} aria-hidden="true" /> : <Copy size={compact ? 20 : 17} aria-hidden="true" />}{!compact ? copyState === 'copied' ? 'Copied' : 'Copy address' : <span className="visually-hidden">{copyState === 'copied' ? 'Address copied' : 'Copy address'}</span>}</button>
    </div>{blockedMessage || !compact ? <small>{blockedMessage || 'Opens Google Maps'}</small> : null}</> : task ? <Link to={teamContactsPath(task.externalId, task.operation, task.stopId, true)}>Contact team</Link> : null}
    {saveFailed ? <p role="alert">Draft could not be saved. Keep this screen open and retry Navigate after checking device storage.</p> : null}
    {copyState === 'failed' ? <label>Clipboard unavailable. Copy address manually<input aria-label="Address to copy" readOnly value={address} onFocus={(event) => event.target.select()} /></label> : null}
  </section>
}

export function OrderStopNavigation({ order, operation, stopId, beforeNavigate, blockedMessage }: {
  order: string; operation: SpokeOperation; stopId?: string; beforeNavigate?: () => boolean; blockedMessage?: string
}) {
  const { spokeRoute } = useCargo()
  const tasks = orderContextTasks((spokeRoute ?? mockTodaySpokeRoute).tasks, order, operation, stopId)
  const task = tasks.length === 1 ? tasks[0] : undefined
  return <div className="order-stop-directions">
    <StopNavigation key={`${order}:${operation}:${stopId}:${task?.address}`} task={task} beforeNavigate={beforeNavigate} blockedMessage={blockedMessage} unavailableMessage={tasks.length > 1 ? 'Select a stop to navigate' : 'Address unavailable'} />
    {!task ? <Link to={teamContactsPath(order, operation, undefined, tasks.length <= 1)}>{tasks.length > 1 ? 'Select stop in Order details' : 'Contact team'}</Link> : null}
  </div>
}
