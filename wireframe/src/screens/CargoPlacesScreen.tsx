import { ChevronRight, MapPin, PackageSearch, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { cargoPlaceStatusLabels } from '../cargoPlaceTracking'
import { useTrackedCargoPlaces } from '../useTrackedCargoPlaces'

export function CargoPlacesScreen() {
  const places = useTrackedCargoPlaces()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('order') ?? '')
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return places
    return places.filter((place) => `${place.placeId} ${place.orderNumber} ${place.currentLocation} ${place.status}`.toLowerCase().includes(normalized))
  }, [places, query])

  return (
    <CargoShell>
      <div className="cargo-places cargo-nav-screen">
        <div className="screen-title"><h1>Cargo places</h1><p>{places.length} tracked places</p></div>
        <label className="search-field"><Search size={19} /><input aria-label="Search cargo places" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="PlaceID, Order or location" /></label>
        <div className="cargo-place-list">
          {visible.map((place) => (
            <Link key={place.placeId} to={`/places/${place.placeId}`} className="cargo-place-card">
              <span className="cargo-place-icon"><PackageSearch size={21} /></span>
              <span className="cargo-place-main"><strong>{place.placeId}</strong><small>Order #{place.orderNumber} · {place.placeNumber}/{place.totalPlaces}</small><em><MapPin size={13} /> {place.currentLocation}</em></span>
              <span className={`cargo-place-status cargo-place-status--${place.status}`}>{cargoPlaceStatusLabels[place.status]}</span>
              <ChevronRight size={19} />
            </Link>
          ))}
          {!visible.length ? <p className="spoke-task-empty">No CargoPlace matches this search.</p> : null}
        </div>
      </div>
    </CargoShell>
  )
}
