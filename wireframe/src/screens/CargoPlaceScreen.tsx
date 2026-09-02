import { Barcode, Clock3, MapPin, PackageSearch, Ruler, Scale } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { cargoPlaceStatusLabels, cargoPlaceWeightSourceLabels } from '../cargoPlaceTracking'
import { useCargo } from '../cargoStore'
import { operationalName } from '../orderDetailsDomain'
import { useTrackedCargoPlaces } from '../useTrackedCargoPlaces'

export function CargoPlaceScreen() {
  const { placeId = '' } = useParams()
  const places = useTrackedCargoPlaces()
  const { getOrderDetails } = useCargo()
  const place = places.find((item) => item.placeId.toLowerCase() === placeId.toLowerCase())

  if (!place) return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Cargo place" subtitle={placeId || 'Unknown PlaceID'} />
      <div className="cargo-place-empty"><PackageSearch size={44} /><h2>Place not found</h2><p>Scan again or open Cargo places from More.</p></div>
      <CargoBottomNav />
    </div>
  )

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title={`Place ${place.placeNumber}/${place.totalPlaces}`} subtitle={place.placeId} />
      <main className="cargo-place-detail">
        <section className="cargo-place-hero">
          <span className={`cargo-place-status cargo-place-status--${place.status}`}>{cargoPlaceStatusLabels[place.status]}</span>
          <code>{place.placeId}</code>
          <p><MapPin size={16} /> {place.currentLocation}</p>
        </section>

        <Link className="order-name-summary" to={`/orders/${place.orderNumber}/details`}>{operationalName(getOrderDetails(place.orderNumber), place.orderNumber)} · Order details</Link>
        <section className="cargo-place-facts">
          <div><PackageSearch size={20} /><span><small>Order / place</small><strong>#{place.orderNumber} · {place.placeNumber}/{place.totalPlaces}</strong></span></div>
          <div><Ruler size={20} /><span><small>Dimensions</small><strong>{place.dimensions}</strong></span></div>
          <div><Scale size={20} /><span><small>Weight</small><strong>{place.estimatedWeight === null ? 'Not measured' : `${place.estimatedWeight} lb`}</strong><em>{cargoPlaceWeightSourceLabels[place.weightSource]}</em></span></div>
          <div><Barcode size={20} /><span><small>Label</small><strong>{place.label}</strong></span></div>
        </section>

        {place.unknownReason ? <p className="measurement-warning">Measurement note: {place.unknownReason}</p> : null}
        <section className="cargo-place-history">
          <h2><Clock3 size={19} /> Event history</h2>
          {place.events.map((event, index) => (
            <div key={event.id} className={index === place.events.length - 1 ? 'is-current' : ''}>
              <span />
              <time>{event.at}</time>
              <p><strong>{event.title}</strong><small>{event.detail}</small></p>
            </div>
          ))}
        </section>
      </main>
      <CargoBottomNav />
    </div>
  )
}
