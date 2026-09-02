import { Camera, Clock3, History, LockKeyhole, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery, SuccessState } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import {
  addPickupDraftGroup, createPickupDraft, pickupDraftGroups, pickupDraftToRecord, pickupDraftVolume, pickupDraftWeight,
  recordPickupDraftGroupEdit, removePickupDraftGroup, updatePickupDraftGroup,
  type PickupDraft,
} from '../pickupDraftDomain'
import { findPickupDemoRecord } from '../pickupDemoData'
import { findPickupDraft, readPickupDrafts, upsertPickupDraft, writePickupDrafts } from '../pickupDraftStore'
import {
  findDraftSupplementalPickup, prepareSupplementalPickup, syncPickupOrderEbolDraft,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from '../orderEbolStore'
import { mockTodaySpokeRoute } from '../spokeDomain'
import { usePrototypeScenario } from '../prototypeScenarioStore'

const groupFields: Array<{ field: 'quantity' | 'length' | 'width' | 'height' | 'weight'; label: string; suffix: string }> = [
  { field: 'quantity', label: 'Qty', suffix: 'pcs' },
  { field: 'length', label: 'L', suffix: 'in' },
  { field: 'width', label: 'W', suffix: 'in' },
  { field: 'height', label: 'H', suffix: 'in' },
  { field: 'weight', label: 'Weight / place', suffix: 'lb' },
]

function updateDraftMeta<K extends keyof PickupDraft>(draft: PickupDraft, field: K, value: PickupDraft[K]): PickupDraft {
  return { ...draft, [field]: value, updatedAt: new Date().toISOString() }
}

export function PickupCaptureScreen() {
  const [params] = useSearchParams()
  return <PickupCaptureForm key={params.toString()} />
}

function PickupCaptureForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { findRecord, savePickup } = useCargo()
  const { branch, devices } = usePrototypeScenario()
  const requestedOrder = normalizeOrderNumber(params.get('order') ?? '11155599')
  const currentRecord = findRecord(requestedOrder)
  const [mode] = useState<'standard' | 'supplemental'>(() => {
    const persistedEbol = findOrderEbol(readOrderEbols(), requestedOrder)
    return params.get('supplemental') === '1' || Boolean(persistedEbol?.pickup.lockedAt) ? 'supplemental' : 'standard'
  })
  const [restoredDraft] = useState(() => findPickupDraft(readPickupDrafts(), requestedOrder, mode))
  const [wasRestored] = useState(Boolean(restoredDraft))
  const demoRecord = findPickupDemoRecord(requestedOrder)
  const [draft, setDraft] = useState<PickupDraft>(() => restoredDraft ?? {
    ...createPickupDraft(currentRecord ?? demoRecord, branch, mode), orderNumber: requestedOrder,
  })
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saving')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedVersion, setSavedVersion] = useState(1)
  const volume = useMemo(() => pickupDraftVolume(draft), [draft])
  const addedWeight = useMemo(() => pickupDraftWeight(draft), [draft])
  const groups = pickupDraftGroups(draft)

  useEffect(() => {
    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      const didSave = writePickupDrafts(upsertPickupDraft(readPickupDrafts(), draft))
      setSaveState(didSave ? 'saved' : 'error')
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [draft])

  const addGroup = () => setDraft((current) => addPickupDraftGroup(current))
  const removeGroup = (groupId: string) => setDraft((current) => removePickupDraftGroup(current, groupId))
  const updateGroup = (groupId: string, field: typeof groupFields[number]['field'], value: string) => {
    setDraft((current) => updatePickupDraftGroup(current, groupId, field, Number(value) || 0))
  }
  const commitGroupEdit = (groupId: string) => setDraft((current) => recordPickupDraftGroupEdit(current, groupId))
  const loadDemoData = () => {
    if (!demoRecord || draft.mode !== 'standard') return
    if (!window.confirm('Replace this editable draft with demo data? Saved documents will not be changed until you continue to review.')) return
    setDraft(createPickupDraft(demoRecord, branch, 'standard'))
  }

  const submit = () => {
    const normalizedOrderNumber = normalizeOrderNumber(draft.orderNumber)
    const latestRecord = findRecord(normalizedOrderNumber)
    const title = draft.title
      || latestRecord?.title
      || mockTodaySpokeRoute.tasks.find((task) => task.externalId === normalizedOrderNumber)?.title
      || ''
    const normalizedDraft = { ...draft, orderNumber: normalizedOrderNumber, title }
    const record = pickupDraftToRecord(normalizedDraft, latestRecord)
    const orderEbols = readOrderEbols()
    const existingEbol = findOrderEbol(orderEbols, record.orderNumber)
    let nextEbol
    if (normalizedDraft.mode === 'supplemental') {
      if (!existingEbol?.pickup.lockedAt) return
      nextEbol = prepareSupplementalPickup(existingEbol, {
        addedPlaceIds: normalizedDraft.places.map((place) => place.placeId),
        totalWeight: addedWeight,
        totalVolume: volume,
        photoCount: normalizedDraft.photoCount,
        changeHistory: normalizedDraft.history,
      })
      setSavedVersion(findDraftSupplementalPickup(nextEbol)?.version ?? 2)
    } else {
      nextEbol = syncPickupOrderEbolDraft(existingEbol, record)
    }
    savePickup(record)
    writeOrderEbols(upsertOrderEbol(orderEbols, nextEbol))
    setSaved(true)
  }

  if (saved) {
    const orderNumber = normalizeOrderNumber(draft.orderNumber)
    const supplemental = draft.mode === 'supplemental'
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title={supplemental ? 'Supplemental Pickup' : 'Pickup'} />
        <SuccessState
          title={supplemental ? `Document version ${savedVersion} drafted` : 'Pickup draft ready'}
          message={supplemental
            ? `${draft.places.length} added ${draft.places.length === 1 ? 'place requires' : 'places require'} new confirmations. Version 1 remains unchanged.`
            : `Order #${orderNumber} and ${draft.places.length} places are ready for review.`}
          action={<div className="ebol-success-actions"><button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${orderNumber}/ebol/pickup`)}>Open {supplemental ? `version ${savedVersion}` : 'Pickup'} review</button><button type="button" className="ebol-secondary" onClick={() => navigate(`/orders/${orderNumber}/labels`)}>Open place labels</button><button type="button" className="ebol-secondary" onClick={() => navigate('/')}>Back to Home</button></div>}
        />
        <CargoBottomNav />
      </div>
    )
  }

  const canContinue = Boolean(normalizeOrderNumber(draft.orderNumber)) && draft.places.length > 0 && draft.photoCount > 0
  const title = draft.mode === 'supplemental' ? 'Supplemental Pickup' : 'Pickup draft'

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title={title} subtitle={`Order #${draft.orderNumber || 'new'}`} />
      <form className="pickup-form pickup-draft-form" onSubmit={(event) => { event.preventDefault(); submit() }}>
        <div className={`draft-save-state draft-save-state--${saveState}`} role="status">
          {saveState === 'saving' ? <Clock3 size={17} /> : <Save size={17} />}
          <span><strong>{saveState === 'saving' ? 'Saving draft…' : saveState === 'saved' ? 'Draft autosaved' : 'Draft could not be saved'}</strong><small>{wasRestored ? 'Restored after reopening this operation' : 'Changes stay on this device in the prototype'}</small></span>
        </div>

        <section className="pickup-demo-note">
          <span><strong>{draft.title || 'Pickup order'}</strong><small>Demo data · photos and measurements are mock. Confirmations remain manual.</small></span>
          {demoRecord && draft.mode === 'standard' ? <button type="button" onClick={loadDemoData}>Load demo data</button> : null}
        </section>

        {draft.mode === 'supplemental' ? (
          <section className="supplemental-lock-reference">
            <LockKeyhole size={22} />
            <span><strong>Version 1 is locked</strong><small>{draft.basePlaceIds.length} signed PlaceID values remain unchanged. Only new places are editable below.</small></span>
          </section>
        ) : null}

        <div className="two-column-fields">
          <label>Order #<input inputMode="numeric" value={draft.orderNumber} disabled={draft.mode === 'supplemental'} onChange={(event) => setDraft((current) => updateDraftMeta(current, 'orderNumber', event.target.value))} /></label>
          <label>Pickup date<input type="date" value={draft.pickupDate} onChange={(event) => setDraft((current) => updateDraftMeta(current, 'pickupDate', event.target.value))} /></label>
        </div>
        <label>Responsible manager<select value={draft.responsible} onChange={(event) => setDraft((current) => updateDraftMeta(current, 'responsible', event.target.value))}><option>John Doe</option><option>Maria Lopez</option><option>Daniel Kim</option></select></label>
        <label>Packaging<select value={draft.packaging} onChange={(event) => setDraft((current) => updateDraftMeta(current, 'packaging', event.target.value))}><option>Customer</option><option>Zaberman</option><option>Mixed</option></select></label>
        <label>Order comment<textarea rows={2} value={draft.orderComment} onChange={(event) => setDraft((current) => updateDraftMeta(current, 'orderComment', event.target.value))} /></label>

        <section className="cargo-totals">
          <label><span>{draft.mode === 'supplemental' ? 'Added places' : 'Places'}</span><span><input aria-label="Places" value={draft.places.length} readOnly /> pcs</span></label>
          <label><span>{draft.mode === 'supplemental' ? 'Added weight' : 'Total weight'}</span><span><input aria-label="Total weight" value={addedWeight} readOnly /> lb</span></label>
        </section>

        <section className="draft-places-section">
          <div className="form-section-title"><h2>{draft.mode === 'supplemental' ? 'New dimension groups' : 'Dimension groups'}</h2><span>{groups.length} {groups.length === 1 ? 'group' : 'groups'} · {draft.places.length} pcs</span></div>
          <p className="dimension-group-help">One group for places with the same dimensions and weight. Each place keeps its own label.</p>
          <div className="draft-place-list">
            {groups.map((group, index) => (
              <article className="draft-place-card" key={group.id}>
                <header><span><strong>Group {index + 1}</strong><code>{group.quantity} {group.quantity === 1 ? 'place' : 'places'} · individual PlaceIDs preserved</code></span><button type="button" onClick={() => removeGroup(group.id)} aria-label={`Remove group ${index + 1}`}><Trash2 size={18} /></button></header>
                <div className="draft-place-fields draft-group-fields">
                  {groupFields.map(({ field, label, suffix }) => <label key={field}><span>{label}</span><span><input aria-label={`${label} for group ${index + 1}`} inputMode={field === 'quantity' ? 'numeric' : 'decimal'} type="number" min={field === 'quantity' ? 1 : 0} max={field === 'quantity' ? 999 : undefined} step={field === 'quantity' ? 1 : 'any'} value={group[field]} onChange={(event) => updateGroup(group.id, field, event.target.value)} onBlur={() => commitGroupEdit(group.id)} /><small>{suffix}</small></span></label>)}
                </div>
              </article>
            ))}
            {!draft.places.length ? <div className="draft-places-empty">No editable groups yet. Add a dimension group and enter its quantity.</div> : null}
          </div>
          <button type="button" className="add-dimension" onClick={addGroup}><Plus size={18} /> Add dimension group</button>
          <div className="volume-total"><span>{draft.mode === 'supplemental' ? 'Added volume' : 'Total volume'}</span><strong>{volume.toFixed(2)} cu ft</strong></div>
        </section>

        <section className="photo-section">
          <div className="form-section-title"><h2>{draft.mode === 'supplemental' ? 'New-place photos' : 'Cargo photos'}</h2><span>{draft.photoCount} photos</span></div>
          <p>Photograph the places and packing condition included in this version.</p>
          <EvidenceGallery count={draft.photoCount} editable addDisabled={!devices.camera} onAdd={() => setDraft((current) => updateDraftMeta(current, 'photoCount', current.photoCount + 1))} onRemove={() => setDraft((current) => updateDraftMeta(current, 'photoCount', Math.max(0, current.photoCount - 1)))} />
          <button type="button" className="camera-action" disabled={!devices.camera} onClick={() => setDraft((current) => updateDraftMeta(current, 'photoCount', current.photoCount + 1))}><Camera size={20} /> {devices.camera ? 'Take another photo' : 'Camera unavailable'}</button>
        </section>

        <section className="draft-history">
          <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)}><History size={19} /><span><strong>Change history</strong><small>{draft.history.length} recorded changes</small></span><Plus className={historyOpen ? 'is-open' : ''} size={18} /></button>
          {historyOpen ? <ol>{[...draft.history].reverse().map((entry) => <li key={entry.id}><span>{entry.detail}</span><time>{new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></li>)}</ol> : null}
        </section>

        <div className="flow-action"><button className="cargo-primary" type="submit" disabled={!canContinue}>{draft.mode === 'supplemental' ? 'Create new document version' : 'Continue to Pickup review'}</button></div>
      </form>
      <CargoBottomNav />
    </div>
  )
}
