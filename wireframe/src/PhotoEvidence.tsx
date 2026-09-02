import { Camera, ImagePlus, RefreshCw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCargo } from './cargoStore'
import { addEvidencePhoto, photoCategories, removeEvidencePhoto, type EvidencePhoto, type EvidenceSyncStatus, type PhotoCategory, type PhotoHandoff } from './photoEvidenceDomain'
import { usePrototypeScenario } from './prototypeScenarioStore'

const syncLabels: Record<EvidenceSyncStatus, string> = {
  pending: 'Pending', syncing: 'Syncing…', synced: 'Synced', retry: 'Retry needed', conflict: 'Needs review', rejected: 'Rejected',
}

function PhotoPreview({ photo, onClose }: { photo: EvidencePhoto; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return createPortal(<dialog className="photo-preview" ref={dialog} onClose={onClose} aria-label="Photo preview">
    <header><strong>{photoCategories[photo.category]}</strong><button type="button" aria-label="Close photo preview" onClick={() => dialog.current?.close()}><X size={22} /></button></header>
    <div className={`evidence-photo evidence-photo--${photo.asset + 1}`} role="img" aria-label={`${photoCategories[photo.category]} cargo`} />
    <p>Order #{photo.orderNumber} · {photo.handoff === 'pickup' ? 'Pickup' : 'Delivery'}</p>
    <small>{photo.source === 'fixture' ? 'Cargo photo' : photo.source === 'camera' ? 'Camera' : 'Gallery'}</small>
    <code>{photo.id}</code>
  </dialog>, document.body)
}

export function PhotoGallery({ photos, onRemove, statuses }: {
  photos: EvidencePhoto[]; onRemove?: (id: string) => void; statuses?: Map<string, EvidenceSyncStatus>
}) {
  const [category, setCategory] = useState<PhotoCategory | 'all'>('all')
  const [limit, setLimit] = useState(12)
  const [preview, setPreview] = useState<EvidencePhoto | null>(null)
  const visible = photos.filter((photo) => category === 'all' || photo.category === category)
  return <div className="photo-library">
    <label className="photo-filter">Show photos<select aria-label="Filter photos" value={category} onChange={(event) => { setCategory(event.target.value as PhotoCategory | 'all'); setLimit(12) }}>
      <option value="all">All photos ({photos.length})</option>
      {Object.entries(photoCategories).map(([value, label]) => <option value={value} key={value}>{label} ({photos.filter((photo) => photo.category === value).length})</option>)}
    </select></label>
    <div className="photo-grid" aria-label={`${visible.length} cargo photos`}>
      {visible.slice(0, limit).map((photo) => {
        const number = photos.indexOf(photo) + 1
        const status = statuses?.get(photo.id)
        return <article className="photo-card" key={photo.id}>
          <button type="button" className={`evidence-photo photo-thumbnail evidence-photo--${photo.asset + 1}`} aria-label={`View photo ${number} · ${photoCategories[photo.category]}`} onClick={() => setPreview(photo)} />
          {onRemove ? <button type="button" className="photo-remove" aria-label={`Remove photo ${number}`} onClick={() => onRemove(photo.id)}><X size={16} /></button> : null}
          <strong>{number}. {photoCategories[photo.category]}</strong>
          {status ? <small className={`photo-status photo-status--${status}`}>{syncLabels[status]}</small> : null}
        </article>
      })}
    </div>
    {!visible.length ? <p className="photo-empty">{photos.length ? 'No photos in this category.' : 'No photos yet. Add a photo to continue.'}</p> : null}
    {visible.length > limit ? <button type="button" className="camera-action" onClick={() => setLimit((current) => current + 12)}>Show more photos ({visible.length - limit} remaining)</button> : null}
    {preview ? <PhotoPreview photo={preview} onClose={() => setPreview(null)} /> : null}
  </div>
}

export function EvidenceQueuePanel({ operationId }: { operationId?: string }) {
  const { evidenceQueue, evidenceStorageError, syncEvidence, keepLocalEvidence, pendingChanges, forceSync, syncStatus } = useCargo()
  const { network } = usePrototypeScenario()
  const [showAll, setShowAll] = useState(false)
  const items = evidenceQueue.filter((item) => !operationId || item.operationId === operationId)
  const pending = items.filter((item) => item.status !== 'synced')
  const otherPending = operationId ? 0 : Math.max(0, pendingChanges - evidenceQueue.filter((item) => item.status !== 'synced').length)
  const pendingCount = pending.length + otherPending
  const conflicts = items.filter((item) => item.status === 'conflict')
  const syncing = (!operationId && syncStatus === 'syncing') || items.some((item) => item.status === 'syncing')
  const offline = network === 'offline' || !navigator.onLine
  const needsRetry = (!operationId && otherPending > 0 && ['retry', 'rejected', 'conflict'].includes(syncStatus))
    || items.some((item) => item.status === 'retry' || item.status === 'rejected')
  if (!items.length && !otherPending && !evidenceStorageError) return null
  return <section className="evidence-queue" aria-label="Evidence sync queue">
    <div className="evidence-queue-heading" role="status"><span><strong>{evidenceStorageError ? 'Could not save queue' : 'Saved on device'}</strong><small>{offline ? `Offline · ${pendingCount} pending` : syncing ? 'Syncing…' : conflicts.length ? 'Needs review' : needsRetry ? 'Retry needed' : pendingCount ? `${pendingCount} pending` : 'Synced'}</small></span>
      <button type="button" disabled={offline || syncing || !pendingCount || (Boolean(operationId) && !!conflicts.length)} onClick={() => void (operationId ? syncEvidence(operationId) : forceSync())}><RefreshCw size={15} />{needsRetry ? 'Retry sync' : 'Sync now'}</button>
    </div>
    {evidenceStorageError ? <p role="alert">Local storage is unavailable or full. Keep this page open; these changes may not survive a reload.</p> : null}
    {conflicts.map((item) => <div className="evidence-conflict" key={item.id}>
      <strong>Review conflict · {item.label}</strong>
      <dl><div><dt>Local changes</dt><dd>{item.detail}</dd></div><div><dt>Other device</dt><dd>Comment: Awaiting packaging check. Latest local photos not included.</dd></div></dl>
      <p>Keep this device’s draft when syncing. Signed documents will not be replaced.</p>
      <button type="button" onClick={() => keepLocalEvidence(item.operationId)}>Keep local changes</button>
    </div>)}
    {needsRetry ? <p>Transfer failed. Photos remain saved on this device. Check your connection and retry.</p> : null}
    <details><summary>Queue details · {pendingCount} pending / {items.length + otherPending} items</summary>
      <ul>{(showAll ? items : items.slice(0, 8)).map((item) => <li key={item.id}><span>{item.label}</span><small className={`photo-status photo-status--${item.status}`}>{syncLabels[item.status]}</small></li>)}</ul>
      {otherPending ? <p>Other local changes: {otherPending} pending (saved Pickup / Dropoff records).</p> : null}
      {items.length > 8 ? <button type="button" onClick={() => setShowAll((current) => !current)}>{showAll ? 'Show less' : `Show all ${items.length} items`}</button> : null}
    </details>
  </section>
}

export function EvidenceEditor({ photos, orderNumber, handoff, operationId, onChange }: {
  photos: EvidencePhoto[]; orderNumber: string; handoff: PhotoHandoff; operationId: string;
  onChange: (photos: EvidencePhoto[], detail: string) => void
}) {
  const { devices } = usePrototypeScenario()
  const { evidenceQueue } = useCargo()
  const [category, setCategory] = useState<PhotoCategory>(handoff === 'pickup' ? 'before' : 'after')
  const statuses = new Map(evidenceQueue.filter((item) => item.operationId === operationId && item.kind === 'photo')
    .map((item) => [item.detail, item.status]))
  const add = (source: 'camera' | 'gallery') => {
    const photo: EvidencePhoto = { id: crypto.randomUUID(), orderNumber, handoff, category, source, asset: photos.length % 4 }
    onChange(addEvidencePhoto(photos, photo), `${photoCategories[category]} photo added`)
  }
  return <>
    <PhotoGallery photos={photos} statuses={statuses} onRemove={(id) => onChange(removeEvidencePhoto(photos, id), 'Photo removed from draft')} />
    <div className="photo-add-controls">
      <label>New photo category<select value={category} onChange={(event) => setCategory(event.target.value as PhotoCategory)}>{Object.entries(photoCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <div><button type="button" disabled={!devices.camera || photos.length >= 100} onClick={() => add('camera')}><Camera size={18} />{devices.camera ? 'Take photo' : 'Camera unavailable'}</button><button type="button" disabled={photos.length >= 100} onClick={() => add('gallery')}><ImagePlus size={18} />Choose from gallery</button></div>
      {photos.length >= 100 ? <small>Maximum 100 photos per handoff.</small> : null}
    </div>
    <EvidenceQueuePanel operationId={operationId} />
  </>
}
