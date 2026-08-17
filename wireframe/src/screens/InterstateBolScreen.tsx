import { Download, Printer } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { directionLabel, generatedTripToBol, interstateBolArchive } from '../interstateDomain'
import { useInterstate } from '../interstateStore'

export function InterstateBolScreen() {
  const { bolNumber } = useParams()
  const { generatedTrip } = useInterstate()
  const currentBol = generatedTrip ? generatedTripToBol(generatedTrip) : undefined
  const bol = bolNumber
    ? (currentBol?.bolNumber === bolNumber ? currentBol : interstateBolArchive.find((item) => item.bolNumber === bolNumber))
    : currentBol
  if (!bol) return <Navigate to="/interstate/bols" replace />
  return (
    <div className="cargo-flow interstate-bol">
      <CargoFlowHeader title="Interstate BOL" subtitle={bol.tripId} />
      <div className="bol-body">
        <div className="bol-document-state"><span className={bol.status}>{bol.status === 'in_transit' ? 'In transit' : 'Closed'}</span><small>{bol.status === 'closed' ? `Closed ${bol.closedAt}` : `Issued ${bol.createdAt}`}</small></div>
        <section className="bol-paper">
          <header><strong>ZABERMAN</strong><span>BILL OF LADING</span></header>
          <dl><div><dt>BOL Number</dt><dd>{bol.bolNumber}</dd></div><div><dt>TripID</dt><dd>{bol.tripId}</dd></div><div><dt>Route</dt><dd>{directionLabel(bol.direction)}</dd></div><div><dt>Truck</dt><dd>{bol.truck}</dd></div></dl>
          <div className="bol-cargo"><strong>Cargo totals</strong><span>{bol.orderCount} orders</span><span>{bol.placeCount} places</span><span>{bol.loadedWeight} lb</span></div>
          <footer><span>Shipper signature</span><span>Carrier signature</span></footer>
        </section>
        <div className="bol-actions"><button type="button" onClick={() => window.print()}><Download /> Save as PDF</button><button type="button" onClick={() => window.print()}><Printer /> Print</button></div>
        <p>Prototype document preview. The PDF belongs only to this confirmed Trip manifest.</p>
      </div>
      <CargoBottomNav />
    </div>
  )
}
