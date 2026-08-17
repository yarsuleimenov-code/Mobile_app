import { AlertTriangle, Box, Search, Weight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery, SuccessState } from '../cargo-components'
import { calculatePieces, calculateVolume, type CargoRecord } from '../cargoDomain'
import { useCargo } from '../cargoStore'

export function DropoffVerifyScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { findRecord, completeDropoff } = useCargo()
  const [query, setQuery] = useState(params.get('order') ?? '11155599')
  const [record, setRecord] = useState<CargoRecord | undefined>()
  const [searched, setSearched] = useState(false)
  const [matches, setMatches] = useState(false)
  const [noDamage, setNoDamage] = useState(false)
  const [damageReported, setDamageReported] = useState(false)
  const [complete, setComplete] = useState(false)

  const search = () => { setRecord(findRecord(query)); setSearched(true); setMatches(false); setNoDamage(false); setDamageReported(false) }
  useEffect(() => { if (params.get('order')) search() }, [])

  if (complete && record) return (
    <div className="cargo-flow"><CargoFlowHeader title="Dropoff" /><SuccessState title="Dropoff confirmed" message={`Order #${record.orderNumber} passed visual verification.`} action={<button type="button" className="cargo-primary" onClick={() => navigate('/')}>Back to Home</button>} /><CargoBottomNav /></div>
  )

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Dropoff" />
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

            <section className="dimension-recap">
              <h2>Dimensions recap</h2>
              {record.dimensionGroups.map((group) => <p key={group.id}>{group.quantity} × {group.length} × {group.width} × {group.height} in</p>)}
            </section>

            <section className="dropoff-checks">
              <label><input type="checkbox" checked={matches} onChange={(event) => setMatches(event.target.checked)} /><span><strong>Cargo matches pickup photos</strong><small>All pieces and packing look consistent.</small></span></label>
              <label><input type="checkbox" checked={noDamage} onChange={(event) => { setNoDamage(event.target.checked); if (event.target.checked) setDamageReported(false) }} /><span><strong>No visible damage</strong><small>No new damage found during visual check.</small></span></label>
              {damageReported ? <div className="damage-notice"><AlertTriangle size={20} /><span><strong>Damage marked</strong><small>Undamaged Dropoff confirmation is blocked.</small></span><button type="button" onClick={() => setDamageReported(false)}>Cancel</button></div> : <button type="button" className="report-damage" onClick={() => { setDamageReported(true); setNoDamage(false) }}><AlertTriangle size={18} /> Report damage instead</button>}
            </section>

            <div className="flow-action"><button type="button" className="cargo-primary" disabled={!matches || !noDamage} onClick={() => { completeDropoff(record.orderNumber); setComplete(true) }}>Confirm Dropoff</button></div>
          </>
        ) : null}
      </div>
      <CargoBottomNav />
    </div>
  )
}
