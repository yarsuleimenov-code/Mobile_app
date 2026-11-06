import { AlertTriangle, Box, Search, Weight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery, SuccessState } from '../cargo-components'
import { calculatePieces, calculateVolume, normalizeOrderNumber, type CargoRecord } from '../cargoDomain'
import { dimensionText, summarizeMeasurements, weightText, volumeText } from '../measurementDomain'
import { operationalName } from '../orderDetailsDomain'
import { teamContactsPath } from '../teamContactsDomain'
import { OrderStopNavigation, useOrderStopContext } from '../StopNavigation'
import { OrderStopSummary } from '../OrderStopSummary'
import { RouteStopGate } from '../RouteStopExecution'
import { MeasurementNotice } from '../OrderEvidenceDetails'
import { useCargo } from '../cargoStore'
import { findDraftSupplementalPickup, prepareDeliveryEbol } from '../orderEbolDomain'
import { EvidenceEditor } from '../PhotoEvidence'
import { evidencePhotos, type EvidencePhoto } from '../photoEvidenceDomain'
import { findPickupDraft, readPickupDrafts } from '../pickupDraftStore'
import { deliveryPhotoIssues, hasDamagePhoto, readDeliveryDraft, writeDeliveryDraft } from '../deliveryDraftStore'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from '../orderEbolStore'

export function DropoffVerifyScreen() {
  const [params] = useSearchParams()
  const order = normalizeOrderNumber(params.get('order') ?? '11155599')
  return <RouteStopGate key={params.toString()} order={order} operation="dropoff"><DropoffVerifyForm /></RouteStopGate>
}

function DropoffVerifyForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { findRecord, trackEvidenceOperation, getOrderDetails } = useCargo()
  const [query, setQuery] = useState(params.get('order') ?? '11155599')
  const [record, setRecord] = useState<CargoRecord | undefined>()
  const [searched, setSearched] = useState(false)
  const [damageReported, setDamageReported] = useState(false)
  const [complete, setComplete] = useState(false)
  const [deliveryPhotos, setDeliveryPhotos] = useState<EvidencePhoto[]>([])
  const [pickupPhotos, setPickupPhotos] = useState<EvidencePhoto[]>([])
  const [deliveryLocked, setDeliveryLocked] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const deliveryPhotoCount = deliveryPhotos.length
  const [damageNote, setDamageNote] = useState('')
  const draft = useMemo(() => ({ photos: deliveryPhotos, damageReported, damageNote }), [deliveryPhotos, damageReported, damageNote])
  const issues = deliveryPhotoIssues(draft)
  const damagePhotoAdded = hasDamagePhoto(deliveryPhotos)
  const [deliveryEbolReady, setDeliveryEbolReady] = useState(false)
  const [documentSaveError, setDocumentSaveError] = useState('')
  const requestedOrder = normalizeOrderNumber(params.get('order') ?? '')
  const order = record?.orderNumber ?? requestedOrder
  const stopId = order === requestedOrder ? params.get('stop') ?? undefined : undefined
  const stop = useOrderStopContext(order, 'dropoff', stopId)
  const details = record || stop.plannedDate ? getOrderDetails(order) : undefined
  const changingOrder = Boolean(record && normalizeOrderNumber(query) !== record.orderNumber)
  const pendingSupplement = Boolean(record && (findPickupDraft(readPickupDrafts(), record.orderNumber, 'supplemental')?.places.length
    || findDraftSupplementalPickup(findOrderEbol(readOrderEbols(), record.orderNumber))))

  const search = () => {
    const found = findRecord(query)
    setDocumentSaveError('')
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
    setDamageReported(draft.damageReported)
    setDeliveryPhotos(locked && ebol?.delivery.evidence
      ? evidencePhotos(ebol.delivery.evidence, found!.orderNumber, 'delivery') : draft.photos)
    setDamageNote(draft.damageNote)
    setDeliveryEbolReady(false)
  }
  useEffect(() => { if (params.get('order')) search() }, [])
  useEffect(() => {
    if (!record || deliveryLocked) return
    const saved = writeDeliveryDraft(record.orderNumber, draft)
    setStorageError(!saved)
    if (saved) trackEvidenceOperation({ id: `delivery:${record.orderNumber}:draft`, orderNumber: record.orderNumber,
      handoff: 'delivery', photos: draft.photos, detail: `${draft.photos.length} photos · ${draft.damageNote || 'No damage note'}`,
      fingerprint: JSON.stringify(draft) })
  }, [record, deliveryLocked, draft, trackEvidenceOperation])

  const canConfirm = !deliveryLocked && !storageError && !changingOrder && !pendingSupplement && !issues.length

  const saveBeforeNavigation = () => {
    if (!record || deliveryLocked) return true
    const saved = writeDeliveryDraft(record.orderNumber, draft)
    setStorageError(!saved)
    return saved
  }

  const confirmDropoff = () => {
    if (!canConfirm || !record) return
    setDocumentSaveError('')
    const existing = findOrderEbol(readOrderEbols(), record.orderNumber)
    if (existing?.delivery.lockedAt) {
      setDeliveryEbolReady(true)
    } else if (existing?.pickup.lockedAt) {
      try {
        const delivery = prepareDeliveryEbol(existing, { ...record, orderDetails: getOrderDetails(record.orderNumber) }, {
          photoCount: deliveryPhotoCount,
          photos: deliveryPhotos,
          hasDamage: damageReported,
          exceptionNote: damageNote,
        })
        if (!writeOrderEbols(upsertOrderEbol(readOrderEbols(), delivery))) {
          setDocumentSaveError('Delivery review could not be saved. Keep this page open, free device storage and retry.')
          return
        }
        setDeliveryEbolReady(true)
      } catch (error) {
        setDocumentSaveError(error instanceof Error ? error.message : 'Could not prepare Delivery review.')
        return
      }
    }
    setComplete(true)
  }

  if (complete && record) return (
    <div className="cargo-flow"><CargoFlowHeader title="Delivery" /><SuccessState title="Delivery ready for review" message={deliveryEbolReady ? `Delivery evidence for order #${record.orderNumber} is ready for Order eBOL review.` : `Delivery evidence for order #${record.orderNumber} is saved. Lock the Pickup snapshot before Delivery signing.`} action={<div className="ebol-success-actions">{deliveryEbolReady ? <button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${record.orderNumber}/ebol/delivery${params.get('stop') ? `?stop=${encodeURIComponent(params.get('stop')!)}` : ''}`)}>Open Delivery review</button> : <button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${record.orderNumber}/ebol/pickup`)}>Open Pickup review</button>}<button type="button" className="ebol-secondary" onClick={() => navigate('/')}>Back to Home</button></div>} /><CargoBottomNav /></div>
  )

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Delivery" />
      <div className="dropoff-body">
        {!stop.plannedDate ? <form className="order-search" onSubmit={(event) => {
          event.preventDefault()
          const order = normalizeOrderNumber(query)
          if (order !== params.get('order')) navigate(`/dropoff?order=${order}`)
          else search()
        }}>
          <label htmlFor="order-search">Order number</label>
          <div><span>#</span><input id="order-search" inputMode="numeric" value={query.replace('#', '')} onChange={(event) => setQuery(event.target.value)} /><button type="submit"><Search size={20} /><span>Search</span></button></div>
        </form> : null}

        {changingOrder ? <p className="measurement-warning">The evidence below belongs to #{order}. Press Search to open the selected order.</p> : null}
        {details ? <>
          <OrderStopSummary order={order} name={operationalName(details, order, stop.task?.title)} operation="dropoff" task={stop.task} plannedDate={stop.plannedDate}
            actions={<button type="button" className="order-details-action" onClick={() => navigate(teamContactsPath(order, 'dropoff', stopId))}>Order details</button>}>
            <div><h3>Order comment</h3><p>{record?.orderComment?.trim() || 'No order comment'}</p></div>
          </OrderStopSummary>
          <OrderStopNavigation order={order} operation="dropoff" stop={stop} beforeNavigate={saveBeforeNavigation} blockedMessage={changingOrder ? 'Press Search to open the selected order before navigating' : undefined} />
        </> : null}

        {searched && !record ? <div className="not-found"><AlertTriangle /><h2>Order not found</h2><p>Check the number or confirm that Pickup was recorded.</p></div> : null}

        {record ? (
          <>
            {pendingSupplement ? <div className="measurement-warning"><p>Finish the Supplemental Pickup and its signatures before confirming Delivery.</p><button type="button" onClick={() => navigate(`/pickup?order=${record.orderNumber}&supplemental=1`)}>Resume Supplemental Pickup</button></div> : null}
            <section className="found-summary">
              <div><Box size={22} /><strong>{calculatePieces(record.dimensionGroups)} pcs</strong></div>
              <div><Weight size={22} /><strong>{weightText(record.totalWeight, summarizeMeasurements(record.dimensionGroups))}</strong></div>
              <div><Box size={22} /><strong>{volumeText(calculateVolume(record.dimensionGroups), summarizeMeasurements(record.dimensionGroups))}</strong></div>
              <dl><div><dt>Pickup date</dt><dd>{record.pickupDate}</dd></div></dl>
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
                : <EvidenceEditor photos={deliveryPhotos} orderNumber={record.orderNumber} handoff="delivery" operationId={`delivery:${record.orderNumber}:draft`}
                    showDamagePhotos={damageReported} onChange={setDeliveryPhotos}>
                    {damageReported ? (
                      <div className="damage-notice">
                        <div className="damage-notice-heading"><AlertTriangle size={20} aria-hidden="true" /><strong>Damage reported</strong>
                          <button type="button" disabled={damagePhotoAdded} onClick={() => { setDamageReported(false); setDamageNote('') }}>Cancel damage report</button>
                        </div>
                        <div className="delivery-damage-note">
                          <label htmlFor="delivery-damage-details">Damage details</label>
                          <textarea id="delivery-damage-details" rows={3} value={damageNote} onChange={(event) => setDamageNote(event.target.value)} placeholder="Describe the visible damage" />
                        </div>
                        {damagePhotoAdded ? <small>To cancel the report, remove the damage photos first.</small> : null}
                      </div>
                    ) : <button type="button" className="report-damage" onClick={() => setDamageReported(true)}><AlertTriangle size={18} aria-hidden="true" /> Record damage</button>}
                  </EvidenceEditor>}
              {storageError ? <p role="alert">Delivery draft could not be saved. Keep this page open and free local storage.</p> : null}
            </section>

            <section className="dimension-recap">
              <h2>Dimensions recap</h2>
              {record.dimensionGroups.map((group) => <p key={group.id}>Qty {group.quantity} pcs · {dimensionText(group)}</p>)}
            </section>

            <MeasurementNotice summary={summarizeMeasurements(record.dimensionGroups)} />

            {documentSaveError ? <p role="alert" className="measurement-warning">{documentSaveError}</p> : null}
            {!deliveryLocked && !pendingSupplement && !changingOrder && issues.length ? <p className="measurement-warning">{issues.join(' ')}</p> : null}
            <div className="flow-action">{deliveryLocked ? <button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${record.orderNumber}/ebol/delivery${params.get('stop') ? `?stop=${encodeURIComponent(params.get('stop')!)}` : ''}`)}>Open locked Delivery review</button> : <button type="button" className="cargo-primary" disabled={!canConfirm} onClick={confirmDropoff}>Continue to Delivery review</button>}</div>
          </>
        ) : null}
      </div>
      <CargoBottomNav />
    </div>
  )
}
