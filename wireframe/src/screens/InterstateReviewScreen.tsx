import { Check, FileText, Truck } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { useCargo } from '../cargoStore'
import { directionLabel, expandRecordPlaces, getEligibleRecords, summarizeLoadedPlaces, type GeneratedInterstateTrip } from '../interstateDomain'
import { useInterstate } from '../interstateStore'

export function InterstateReviewScreen() {
  const navigate = useNavigate()
  const { records } = useCargo()
  const { direction, truck, loadedPlaceKeys, createTrip } = useInterstate()
  const eligible = getEligibleRecords(records, direction)
  const selected = eligible.flatMap(expandRecordPlaces).filter((place) => loadedPlaceKeys.includes(place.key))
  const summary = summarizeLoadedPlaces(selected)
  if (!selected.length) return <Navigate to="/interstate/loading" replace />

  const submit = () => {
    const trip: GeneratedInterstateTrip = {
      tripId: `${direction.replace('_', '-')}-260816-001`, bolNumber: 'ZB-2026-000184', direction, truck,
      ...summary, createdAt: '08/16/2026 · 09:41 AM',
    }
    createTrip(trip)
    navigate('/interstate/trip')
  }

  const orderNumbers = Array.from(new Set(selected.map((place) => place.orderNumber)))
  return (
    <div className="cargo-flow interstate-review">
      <CargoFlowHeader title="Review loading" subtitle={`${directionLabel(direction)} · ${truck}`} />
      <div className="review-body">
        <div className="review-ready"><span><Check /></span><h2>Manifest ready</h2><p>Only confirmed places below will be fixed in this Trip.</p></div>
        <section className="review-stats"><div><strong>{summary.orderCount}</strong><span>Orders</span></div><div><strong>{summary.placeCount}</strong><span>Places</span></div><div><strong>{summary.loadedWeight} lb</strong><span>Weight</span></div></section>
        <section className="manifest-lines"><h2>Manifest lines</h2>{orderNumbers.map((orderNumber) => { const places = selected.filter((place) => place.orderNumber === orderNumber); return <div key={orderNumber}><Truck /><span><strong>#{orderNumber}</strong><small>{places[0].orderTitle}</small></span><em>{places.length} places</em></div> })}</section>
        <div className="bol-note"><FileText /><span><strong>BOL follows the Trip manifest</strong><small>A document error will not roll back the confirmed loading fact.</small></span></div>
      </div>
      <div className="flow-action interstate-flow-action"><button type="button" className="cargo-primary" onClick={submit}>Create Trip & BOL</button></div>
      <CargoBottomNav />
    </div>
  )
}
