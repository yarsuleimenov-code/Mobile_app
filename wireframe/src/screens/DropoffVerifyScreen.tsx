import { AlertTriangle, Box, Search, Weight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery, SuccessState } from '../cargo-components'
import { calculatePieces, calculateVolume, type CargoRecord } from '../cargoDomain'
import { dimensionText, summarizeMeasurements, weightText, volumeText } from '../measurementDomain'
import { operationalName } from '../orderDetailsDomain'
import { MeasurementNotice } from '../OrderEvidenceDetails'
import { useCargo } from '../cargoStore'
import { prepareDeliveryEbol } from '../orderEbolDomain'
import { EvidenceEditor } from '../PhotoEvidence'
import { evidencePhotos, type EvidencePhoto } from '../photoEvidenceDomain'
import { readDeliveryDraft, writeDeliveryDraft } from '../deliveryDraftStore'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from '../orderEbolStore'

export function DropoffVerifyScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { findRecord, completeDropoff, trackEvidenceOperation, getOrderDetails } = useCargo()
  const [query, setQuery] = useState(params.get('order') ?? '11155599')
  const [record, setRecord] = useState<CargoRecord | undefined>()
  const [searched, setSearched] = useState(false)
  const [matches, setMatches] = useState(false)
  const [noDamage, setNoDamage] = useState(false)
  const [damageReported, setDamageReported] = useState(false)
  const [complete, setComplete] = useState(false)
  const [deliveryPhotos, setDeliveryPhotos] = useState<EvidencePhoto[]>([])
  const [pickupPhotos, setPickupPhotos] = useState<EvidencePhoto[]>([])
  const [deliveryLocked, setDeliveryLocked] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const deliveryPhotoCount = deliveryPhotos.length
  const [damageNote, setDamageNote] = useState('')
  const [deliveryEbolReady, setDeliveryEbolReady] = useState(false)

  const search = () => {
    const found = findRecord(query)
    setRecord(found)
    setSearched(true)
    const draft = readDeliveryDraft(found?.orderNumber ?? query)
    const ebol = found ? findOrderEbol(readOrderEbols(), found.orderNumber) : undefined
    const locked = Boolean(ebol?.delivery.lockedAt)
    setDeliveryLocked(locked)
    setPickupPhotos(found ? ebol?.pickup.lockedAt && ebol.pickup.evidence
      ? [ ...evidencePhotos(ebol.pickup.evidence, found.orderNumber, 'pickup'),
        ...(ebol.pickupSupplements ?? []).filter((item) => item.status === 'locked' && item.evidence)
          .flatMap((item) => evidencePhotos(item.evidence!, found.orderNumber, 'pickup', `supplement-${item.version}`)) ]
      : evidencePhotos(found, found.orderNumber, 'pickup') : [])
    setMatches(draft.matches)
    setNoDamage(draft.noDamage)
    setDamageReported(draft.damageReported)
    setDeliveryPhotos(locked && ebol?.delivery.evidence
      ? evidencePhotos(ebol.delivery.evidence, found!.orderNumber, 'delivery') : draft.photos)
    setDamageNote(draft.damageNote)
    setDeliveryEbolReady(false)
  }
  useEffect(() => { if (params.get('order')) search() }, [])
  useEffect(() => {
    if (!record || deliveryLocked) return
    const draft = { photos: deliveryPhotos, matches, noDamage, damageReported, damageNote }
    const saved = writeDeliveryDraft(record.orderNumber, draft)
    setStorageError(!saved)
    if (saved) trackEvidenceOperation({ id: `delivery:${record.orderNumber}:draft`, orderNumber: record.orderNumber,
      handoff: 'delivery', photos: deliveryPhotos, detail: `${deliveryPhotos.length} photos · ${damageNote || 'No damage note'}`,
      fingerprint: JSON.stringify(draft) })
  }, [record, deliveryLocked, deliveryPhotos, matches, noDamage, damageReported, damageNote, trackEvidenceOperation])

  const canConfirm = matches
    && !deliveryLocked && !storageError
    && deliveryPhotoCount > 0
    && (noDamage || (damageReported && Boolean(damageNote.trim())))

  const confirmDropoff = () => {
    completeDropoff(record!.orderNumber)
    const existing = findOrderEbol(readOrderEbols(), record!.orderNumber)
    if (existing?.delivery.lockedAt) {
      setDeliveryEbolReady(true)
    } else if (existing?.pickup.lockedAt) {
      const delivery = prepareDeliveryEbol(existing, { ...record!, orderDetails: getOrderDetails(record!.orderNumber) }, {
        photoCount: deliveryPhotoCount,
        photos: deliveryPhotos,
        hasDamage: damageReported,
        exceptionNote: damageNote,
      })
      setDeliveryEbolReady(writeOrderEbols(upsertOrderEbol(readOrderEbols(), delivery)))
    }
    setComplete(true)
  }

  if (complete && record) return (
    <div className="cargo-flow"><CargoFlowHeader title="Dropoff" /><SuccessState title="Dropoff confirmed" message={deliveryEbolReady ? `Delivery evidence for order #${record.orderNumber} is ready for Order eBOL review.` : `Dropoff for order #${record.orderNumber} is saved. Lock the Pickup snapshot before Delivery signing.`} action={<div className="ebol-success-actions">{deliveryEbolReady ? <button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${record.orderNumber}/ebol/delivery`)}>Open Delivery review</button> : <button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${record.orderNumber}/ebol/pickup`)}>Open Pickup review</button>}<button type="button" className="ebol-secondary" onClick={() => navigate('/')}>Back to Home</button></div>} /><CargoBottomNav /></div>
  )

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Dropoff" subtitle={params.get('order') ? `Spoke order #${params.get('order')}` : undefined} />
      <div className="dropoff-body">
        <form className="order-search" onSubmit={(event) => { event.preventDefault(); search() }}>
          <label htmlFor="order-search">Order number</label>
          <div><span>#</span><input id="order-search" inputMode="numeric" value={query.replace('#', '')} onChange={(event) => setQuery(event.target.value)} /><button type="submit"><Search size={20} /><span>Search</span></button></div>
        </form>

        {searched && !record ? <div className="not-found"><AlertTriangle /><h2>Order not found</h2><p>Check the number or confirm that Pickup was recorded.</p></div> : null}

        {record ? (
          <>
            <section className="order-name-summary"><strong>{operationalName(getOrderDetails(record.orderNumber), record.orderNumber)}</strong><button type="button" onClick={() => navigate(`/orders/${record.orderNumber}/details`)}>Order details</button></section>
            <section className="found-summary">
              <div><Box size={22} /><strong>{calculatePieces(record.dimensionGroups)} pcs</strong></div>
              <div><Weight size={22} /><strong>{weightText(record.totalWeight, summarizeMeasurements(record.dimensionGroups))}</strong></div>
              <div><Box size={22} /><strong>{volumeText(calculateVolume(record.dimensionGroups), summarizeMeasurements(record.dimensionGroups))}</strong></div>
              <dl><div><dt>Pickup date</dt><dd>{record.pickupDate}</dd></div><div><dt>Responsible manager</dt><dd>{record.responsible}</dd></div></dl>
            </section>

            <section className="dropoff-photos">
              <div className="form-section-title"><h2>Pickup photos</h2><span>{pickupPhotos.length} photos</span></div>
              <p>Compare the cargo in front of you with this pickup record.</p>
              <EvidenceGallery count={pickupPhotos.length} photos={pickupPhotos} />
            </section>

            <section className="dropoff-photos delivery-photo-section">
              <div className="form-section-title"><h2>Delivery photos</h2><span>{deliveryPhotoCount} photos</span></div>
              <p>Capture the cargo condition at the Delivery handoff.</p>
              {deliveryLocked ? <><p>Delivery snapshot is locked. These photos cannot be edited.</p><EvidenceGallery count={deliveryPhotoCount} photos={deliveryPhotos} /></>
                : <EvidenceEditor photos={deliveryPhotos} orderNumber={record.orderNumber} handoff="delivery" operationId={`delivery:${record.orderNumber}:draft`} onChange={setDeliveryPhotos} />}
              {storageError ? <p role="alert">Delivery draft could not be saved. Keep this page open and free local storage.</p> : null}
            </section>

            <section className="dimension-recap">
              <h2>Dimensions recap</h2>
              {record.dimensionGroups.map((group) => <p key={group.id}>Qty {group.quantity} pcs · {dimensionText(group)}</p>)}
            </section>

            <MeasurementNotice summary={summarizeMeasurements(record.dimensionGroups)} />
            <section className="dropoff-checks" hidden={deliveryLocked}>
              <label><input type="checkbox" checked={matches} onChange={(event) => setMatches(event.target.checked)} /><span><strong>Cargo matches pickup photos</strong><small>All pieces and packing look consistent.</small></span></label>
              <label><input type="checkbox" checked={noDamage} onChange={(event) => { setNoDamage(event.target.checked); if (event.target.checked) { setDamageReported(false); setDamageNote('') } }} /><span><strong>No visible damage</strong><small>No new damage found during visual check.</small></span></label>
              {damageReported ? <div className="damage-notice"><AlertTriangle size={20} /><span><strong>Damage marked</strong><small>Documented damage does not block Delivery.</small></span><button type="button" onClick={() => { setDamageReported(false); setDamageNote('') }}>Cancel</button></div> : <button type="button" className="report-damage" onClick={() => { setDamageReported(true); setNoDamage(false) }}><AlertTriangle size={18} /> Report damage instead</button>}
              {damageReported ? <label className="delivery-damage-note">Damage details<textarea rows={3} value={damageNote} onChange={(event) => setDamageNote(event.target.value)} placeholder="Describe damage, packaging issue or other exception" /></label> : null}
            </section>

            <div className="flow-action">{deliveryLocked ? <button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${record.orderNumber}/ebol/delivery`)}>Open locked Delivery review</button> : <button type="button" className="cargo-primary" disabled={!canConfirm} onClick={confirmDropoff}>Confirm Dropoff</button>}</div>
          </>
        ) : null}
      </div>
      <CargoBottomNav />
    </div>
  )
}
