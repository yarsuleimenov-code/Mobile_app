import { AlertTriangle, Box, Search, Weight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery, SuccessState } from '../cargo-components'
import { calculatePieces, calculateVolume, type CargoRecord } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import { prepareDeliveryEbol } from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from '../orderEbolStore'
import { usePrototypeScenario } from '../prototypeScenarioStore'

export function DropoffVerifyScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { findRecord, completeDropoff } = useCargo()
  const { devices } = usePrototypeScenario()
  const [query, setQuery] = useState(params.get('order') ?? '11155599')
  const [record, setRecord] = useState<CargoRecord | undefined>()
  const [searched, setSearched] = useState(false)
  const [matches, setMatches] = useState(false)
  const [noDamage, setNoDamage] = useState(false)
  const [damageReported, setDamageReported] = useState(false)
  const [complete, setComplete] = useState(false)
  const [deliveryPhotoCount, setDeliveryPhotoCount] = useState(2)
  const [damageNote, setDamageNote] = useState('')
  const [deliveryEbolReady, setDeliveryEbolReady] = useState(false)

  const search = () => {
    setRecord(findRecord(query))
    setSearched(true)
    setMatches(false)
    setNoDamage(false)
    setDamageReported(false)
    setDeliveryPhotoCount(2)
    setDamageNote('')
    setDeliveryEbolReady(false)
  }
  useEffect(() => { if (params.get('order')) search() }, [])

  const canConfirm = matches
    && deliveryPhotoCount > 0
    && (noDamage || (damageReported && Boolean(damageNote.trim())))

  const confirmDropoff = () => {
    completeDropoff(record!.orderNumber)
    const existing = findOrderEbol(readOrderEbols(), record!.orderNumber)
    if (existing?.delivery.lockedAt) {
      setDeliveryEbolReady(true)
    } else if (existing?.pickup.lockedAt) {
      const delivery = prepareDeliveryEbol(existing, record!, {
        photoCount: deliveryPhotoCount,
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
            <section className="found-summary">
              <div><Box size={22} /><strong>{calculatePieces(record.dimensionGroups)} pcs</strong></div>
              <div><Weight size={22} /><strong>{record.totalWeight} lb</strong></div>
              <div><Box size={22} /><strong>{calculateVolume(record.dimensionGroups).toFixed(2)} cu ft</strong></div>
              <dl><div><dt>Pickup date</dt><dd>{record.pickupDate}</dd></div><div><dt>Responsible manager</dt><dd>{record.responsible}</dd></div></dl>
            </section>

            <section className="dropoff-photos">
              <div className="form-section-title"><h2>Pickup photos</h2><span>{record.photoCount} photos</span></div>
              <p>Compare the cargo in front of you with this pickup record.</p>
              <EvidenceGallery count={record.photoCount} />
            </section>

            <section className="dropoff-photos delivery-photo-section">
              <div className="form-section-title"><h2>Delivery photos</h2><span>{deliveryPhotoCount} photos</span></div>
              <p>Capture the cargo condition at the Delivery handoff.</p>
              <EvidenceGallery count={deliveryPhotoCount} editable addDisabled={!devices.camera} onAdd={() => setDeliveryPhotoCount((count) => count + 1)} onRemove={() => setDeliveryPhotoCount((count) => Math.max(0, count - 1))} />
            </section>

            <section className="dimension-recap">
              <h2>Dimensions recap</h2>
              {record.dimensionGroups.map((group) => <p key={group.id}>{group.quantity} × {group.length} × {group.width} × {group.height} in</p>)}
            </section>

            <section className="dropoff-checks">
              <label><input type="checkbox" checked={matches} onChange={(event) => setMatches(event.target.checked)} /><span><strong>Cargo matches pickup photos</strong><small>All pieces and packing look consistent.</small></span></label>
              <label><input type="checkbox" checked={noDamage} onChange={(event) => { setNoDamage(event.target.checked); if (event.target.checked) { setDamageReported(false); setDamageNote('') } }} /><span><strong>No visible damage</strong><small>No new damage found during visual check.</small></span></label>
              {damageReported ? <div className="damage-notice"><AlertTriangle size={20} /><span><strong>Damage marked</strong><small>Documented damage does not block Delivery.</small></span><button type="button" onClick={() => { setDamageReported(false); setDamageNote('') }}>Cancel</button></div> : <button type="button" className="report-damage" onClick={() => { setDamageReported(true); setNoDamage(false) }}><AlertTriangle size={18} /> Report damage instead</button>}
              {damageReported ? <label className="delivery-damage-note">Damage details<textarea rows={3} value={damageNote} onChange={(event) => setDamageNote(event.target.value)} placeholder="Describe damage, packaging issue or other exception" /></label> : null}
            </section>

            <div className="flow-action"><button type="button" className="cargo-primary" disabled={!canConfirm} onClick={confirmDropoff}>Confirm Dropoff</button></div>
          </>
        ) : null}
      </div>
      <CargoBottomNav />
    </div>
  )
}
