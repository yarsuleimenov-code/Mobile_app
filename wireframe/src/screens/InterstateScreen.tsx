import { ArrowRight, ChevronRight, FileCheck2, FileSearch, PackageOpen, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { warehouses, type Warehouse } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import { directionLabel, expandRecordPlaces, getEligibleRecords, interstateBolArchive, interstateIncomingTrips, interstateTrucks } from '../interstateDomain'
import { useInterstate } from '../interstateStore'

export function InterstateScreen() {
  const navigate = useNavigate()
  const { records } = useCargo()
  const { direction, originWarehouse, destinationWarehouse, setOriginWarehouse, setDestinationWarehouse, truck, setTruck, clearLoading, generatedTrip, completedUnloadingTripIds } = useInterstate()
  const eligible = getEligibleRecords(records, direction)
  const places = eligible.flatMap(expandRecordPlaces)
  const totalWeight = eligible.reduce((total, record) => total + record.totalWeight, 0)
  const availableIncomingTrips = interstateIncomingTrips.filter((trip) => !completedUnloadingTripIds.includes(trip.tripId))
  const recentArchive = interstateBolArchive.filter((bol) => (
    !interstateIncomingTrips.some((trip) => trip.tripId === bol.tripId)
    || completedUnloadingTripIds.includes(bol.tripId)
  ))

  return (
    <div className="cargo-flow interstate-home">
      <CargoFlowHeader title="Interstate" showBack={false} />
      <div className="interstate-body">
        <section className="warehouse-route">
          <h2>Route <span>Select warehouses</span></h2>
          <div className="warehouse-selectors">
            <label>Origin warehouse<select aria-label="Origin warehouse" value={originWarehouse} onChange={(event) => setOriginWarehouse(event.target.value as Warehouse)}>{warehouses.map((warehouse) => <option key={warehouse} disabled={warehouse === destinationWarehouse}>{warehouse}</option>)}</select></label>
            <ArrowRight aria-hidden="true" />
            <label>Destination warehouse<select aria-label="Destination warehouse" value={destinationWarehouse} onChange={(event) => setDestinationWarehouse(event.target.value as Warehouse)}>{warehouses.map((warehouse) => <option key={warehouse} disabled={warehouse === originWarehouse}>{warehouse}</option>)}</select></label>
          </div>
        </section>
        <label className="truck-picker">Truck<select value={truck} onChange={(event) => setTruck(event.target.value)}>{interstateTrucks.map((item) => <option key={item}>{item}</option>)}</select></label>

        <section className="eligible-summary">
          <div><strong>{eligible.length}</strong><span>Eligible pickups</span></div>
          <div><strong>{places.length}</strong><span>Places</span></div>
          <div><strong>{totalWeight} lb</strong><span>Total weight</span></div>
        </section>
        <button type="button" className="interstate-primary" disabled={!eligible.length} onClick={() => { clearLoading(); navigate('/interstate/loading') }}><Truck size={21} /> Start loading</button>
        <button type="button" className="bol-search-entry" onClick={() => navigate('/interstate/bols')}><FileSearch /><span><strong>Find or open BOL</strong><small>In-transit and closed documents</small></span><ChevronRight /></button>

        <section className="incoming-trips">
          <h2>Incoming trips <span>Ready to receive</span></h2>
          {availableIncomingTrips.map((trip) => <button type="button" key={trip.tripId} onClick={() => navigate(`/interstate/unloading/${trip.tripId}`)}><PackageOpen /><span><strong>{trip.tripId}</strong><small>{directionLabel(trip.direction)} · {trip.truck}</small><small>BOL {trip.bolNumber}</small></span><em>{trip.placeCount} places</em><ChevronRight /></button>)}
          {!availableIncomingTrips.length ? <div className="incoming-empty"><PackageOpen /><span><strong>No incoming trips</strong><small>All available manifests are unloaded.</small></span></div> : null}
        </section>

        <section className="recent-trips">
          <h2>Recent interstate trips</h2>
          {generatedTrip ? <button type="button" onClick={() => navigate('/interstate/trip')}><Truck /><span><strong>{generatedTrip.tripId}</strong><small>{directionLabel(generatedTrip.direction)} · {generatedTrip.truck}</small></span><em>BOL generated</em><ChevronRight /></button> : null}
          {recentArchive.slice(0, 3).map((bol) => {
            const closed = bol.status === 'closed' || completedUnloadingTripIds.includes(bol.tripId)
            return <button type="button" key={bol.bolNumber} onClick={() => navigate(`/interstate/bol/${bol.bolNumber}`)}><Truck /><span><strong>{bol.tripId}</strong><small>{directionLabel(bol.direction)} · {bol.truck.split(' · ')[0]}</small></span><em className={closed ? 'is-closed' : 'is-generated'}>{closed ? 'Unloaded' : 'In transit'}</em><ChevronRight /></button>
          })}
        </section>

        <div className="interstate-rule"><FileCheck2 size={20} /><span><strong>Manifest uses loaded places only</strong><small>Pickup records stay independent from Interstate status.</small></span></div>
      </div>
      <CargoBottomNav />
    </div>
  )
}
