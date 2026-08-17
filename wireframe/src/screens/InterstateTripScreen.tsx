import { Check, ChevronRight, FileText, Truck } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { directionLabel } from '../interstateDomain'
import { useInterstate } from '../interstateStore'

export function InterstateTripScreen() {
  const navigate = useNavigate()
  const { generatedTrip } = useInterstate()
  if (!generatedTrip) return <Navigate to="/interstate" replace />

  return (
    <div className="cargo-flow interstate-trip">
      <CargoFlowHeader title="Interstate Trip" />
      <div className="trip-body">
        <div className="trip-created"><span><Check size={38} /></span><h2>Trip created</h2><strong>{generatedTrip.tripId}</strong><p>{generatedTrip.createdAt}</p></div>
        <section className="trip-summary"><h2>Manifest summary</h2><div><span><strong>{generatedTrip.orderCount}</strong><small>Orders</small></span><span><strong>{generatedTrip.placeCount}</strong><small>Places loaded</small></span><span><strong>{generatedTrip.loadedWeight} lb</strong><small>Loaded weight</small></span></div><button type="button" onClick={() => navigate('/interstate/review')}>View trip details <ChevronRight /></button></section>
        <section className="bol-generated"><FileText size={31} /><h2>BOL generated</h2><strong>{generatedTrip.bolNumber}</strong><p>{directionLabel(generatedTrip.direction)} · PDF</p><button type="button" className="interstate-primary" onClick={() => navigate(`/interstate/bol/${generatedTrip.bolNumber}`)}><FileText size={20} /> Open BOL</button></section>
        <button type="button" className="back-interstate" onClick={() => navigate('/interstate')}><Truck size={20} /> Back to Interstate</button>
      </div>
      <CargoBottomNav />
    </div>
  )
}
