import { Check, CheckCheck, ChevronDown, ChevronUp, CircleAlert, FileText, PackageCheck, ScanLine, Truck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { directionLabel, interstateIncomingTrips, summarizeLoadedPlaces } from '../interstateDomain'
import { useInterstate } from '../interstateStore'

type ScanFeedback = { type: 'success' | 'error'; message: string }

export function InterstateUnloadingScreen() {
  const navigate = useNavigate()
  const { tripId = '' } = useParams()
  const trip = interstateIncomingTrips.find((item) => item.tripId === tripId)
  const { completeUnloading, completedUnloadingTripIds, receiveAllPlaces, receivePlace, toggleReceivedPlace, unloadingDrafts } = useInterstate()
  const [expandedOrder, setExpandedOrder] = useState(() => trip?.manifest[0]?.orderNumber ?? '')
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<string>()
  const [query, setQuery] = useState('')
  const [scanValue, setScanValue] = useState('')
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback>()
  const [reviewing, setReviewing] = useState(false)
  const [missingConfirmed, setMissingConfirmed] = useState(false)

  const receivedKeys = unloadingDrafts[tripId] ?? []
  const receivedSet = useMemo(() => new Set(receivedKeys), [receivedKeys])
  const orders = useMemo(() => {
    if (!trip) return []
    const orderNumbers = Array.from(new Set(trip.manifest.map((place) => place.orderNumber)))
    return orderNumbers.map((orderNumber) => ({
      orderNumber,
      title: trip.manifest.find((place) => place.orderNumber === orderNumber)?.orderTitle ?? '',
      places: trip.manifest.filter((place) => place.orderNumber === orderNumber),
    }))
  }, [trip])
  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return orders
    return orders.filter((order) => (
      `${order.orderNumber} ${order.title} ${order.places.map((place) => place.key).join(' ')}`
        .toLowerCase()
        .includes(normalizedQuery)
    ))
  }, [orders, query])
  const receivedPlaces = trip?.manifest.filter((place) => receivedSet.has(place.key)) ?? []
  const missingPlaces = trip?.manifest.filter((place) => !receivedSet.has(place.key)) ?? []
  const receivedSummary = summarizeLoadedPlaces(receivedPlaces)
  const completed = completedUnloadingTripIds.includes(tripId)
  const selectedPlace = trip?.manifest.find((place) => place.key === selectedPlaceKey)

  if (!trip) return <Navigate to="/interstate" replace />

  const submitScan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedKey = scanValue.trim().toLowerCase()
    const place = trip.manifest.find((item) => item.key.toLowerCase() === normalizedKey)
    if (!place) {
      setScanFeedback({ type: 'error', message: 'Place ID is not in this Trip manifest.' })
      return
    }
    if (receivedSet.has(place.key)) {
      setScanFeedback({ type: 'success', message: `${place.key} was already received.` })
    } else {
      receivePlace(trip.tripId, place.key)
      setScanFeedback({ type: 'success', message: `${place.key} received.` })
    }
    setExpandedOrder(place.orderNumber)
    setSelectedPlaceKey(place.key)
    setScanValue('')
  }

  if (completed) {
    return (
      <div className="cargo-flow interstate-unloading">
        <CargoFlowHeader title="Unload Interstate" subtitle={trip.tripId} />
        <div className="unloading-body unloading-complete">
          <div className="trip-created"><span><Check size={38} /></span><h2>Unloading complete</h2><strong>{trip.tripId}</strong><p>{directionLabel(trip.direction)} · {trip.truck}</p></div>
          <section className="review-stats"><div><strong>{trip.placeCount}</strong><span>Expected</span></div><div><strong>{receivedPlaces.length}</strong><span>Received</span></div><div><strong>{missingPlaces.length}</strong><span>Missing</span></div></section>
          {missingPlaces.length ? <div className="unloading-warning"><CircleAlert /><span><strong>{missingPlaces.length} discrepancies opened</strong><small>Missing places remain attached to this Trip for investigation.</small></span></div> : <div className="unloading-success-note"><PackageCheck /><span><strong>Manifest matched</strong><small>Every loaded place was received at the destination warehouse.</small></span></div>}
          <button type="button" className="interstate-primary" onClick={() => navigate(`/interstate/bol/${trip.bolNumber}`)}><FileText size={20} /> Open BOL</button>
          <button type="button" className="back-interstate" onClick={() => navigate('/interstate')}><Truck size={20} /> Back to Interstate</button>
        </div>
        <CargoBottomNav />
      </div>
    )
  }

  if (reviewing) {
    return (
      <div className="cargo-flow interstate-unloading">
        <CargoFlowHeader title="Review unloading" subtitle={trip.tripId} onBack={() => { setReviewing(false); setMissingConfirmed(false) }} />
        <div className="unloading-body unloading-review">
          <div className={`review-ready ${missingPlaces.length ? 'has-missing' : ''}`}><span>{missingPlaces.length ? <CircleAlert /> : <Check />}</span><h2>{missingPlaces.length ? 'Missing places found' : 'Manifest matched'}</h2><p>Closing fixes the receiving result for this Trip.</p></div>
          <section className="review-stats"><div><strong>{trip.placeCount}</strong><span>Expected</span></div><div><strong>{receivedPlaces.length}</strong><span>Received</span></div><div><strong>{missingPlaces.length}</strong><span>Missing</span></div></section>
          {missingPlaces.length ? (
            <section className="missing-places">
              <h2>Missing discrepancies</h2>
              {missingPlaces.map((place) => <div key={place.key}><CircleAlert /><span><strong>{place.key}</strong><small>#{place.orderNumber} · Place {place.placeNumber}</small></span></div>)}
              <label className="confirm-missing"><input type="checkbox" checked={missingConfirmed} onChange={(event) => setMissingConfirmed(event.target.checked)} /><span><strong>Confirm {missingPlaces.length} missing {missingPlaces.length === 1 ? 'place' : 'places'}</strong><small>Open a discrepancy for every unreceived Place ID.</small></span></label>
            </section>
          ) : <div className="unloading-success-note"><PackageCheck /><span><strong>Ready to close</strong><small>All expected Place IDs were received.</small></span></div>}
          <button type="button" className="back-to-receiving" onClick={() => { setReviewing(false); setMissingConfirmed(false) }}>Continue receiving</button>
        </div>
        <div className="flow-action interstate-flow-action"><button type="button" className="cargo-primary" disabled={Boolean(missingPlaces.length) && !missingConfirmed} onClick={() => completeUnloading(trip.tripId)}>Confirm unloading</button></div>
        <CargoBottomNav />
      </div>
    )
  }

  return (
    <div className="cargo-flow interstate-unloading">
      <CargoFlowHeader title="Unload Interstate" subtitle={`${directionLabel(trip.direction)} · ${trip.truck.split(' · ')[0]}`} />
      <div className="unloading-body">
        <section className="loading-progress unloading-progress">
          <strong>{receivedPlaces.length} of {trip.placeCount} places received</strong>
          <div><span style={{ width: `${trip.placeCount ? (receivedPlaces.length / trip.placeCount) * 100 : 0}%` }} /></div>
          <dl><div><dt>Received weight</dt><dd>{receivedSummary.loadedWeight} lb</dd></div><div><dt>Not received</dt><dd>{missingPlaces.length} places</dd></div></dl>
        </section>

        <form className="unloading-scan" onSubmit={submitScan}>
          <ScanLine size={21} />
          <input aria-label="Scan Place ID" placeholder="Scan or enter Place ID" value={scanValue} onChange={(event) => setScanValue(event.target.value)} autoCapitalize="characters" />
          <button type="submit" disabled={!scanValue.trim()}>Receive</button>
        </form>
        {scanFeedback ? <div className={`scan-feedback is-${scanFeedback.type}`} aria-live="polite">{scanFeedback.type === 'success' ? <Check /> : <CircleAlert />}<span>{scanFeedback.message}</span></div> : null}

        <label className="loading-search"><input aria-label="Search manifest" placeholder="Search order, item or Place ID" value={query} onChange={(event) => setQuery(event.target.value)} /></label>

        <section className="loading-orders unloading-orders">
          {visibleOrders.map((order) => {
            const receivedCount = order.places.filter((place) => receivedSet.has(place.key)).length
            const expanded = expandedOrder === order.orderNumber
            const status = receivedCount === order.places.length ? 'Received' : receivedCount ? 'Partial' : 'Not received'
            return <article key={order.orderNumber} className={expanded ? 'is-expanded' : ''}>
              <button type="button" className="loading-order-head" onClick={() => setExpandedOrder(expanded ? '' : order.orderNumber)}><span><strong>#{order.orderNumber}</strong><small>{order.title}</small></span><em className={`receive-status receive-status--${status.toLowerCase().replace(' ', '-')}`}>{receivedCount} / {order.places.length} · {status}</em>{expanded ? <ChevronUp /> : <ChevronDown />}</button>
              {expanded ? <div className="place-picker unloading-place-picker">
                <div>{order.places.map((place) => <button type="button" key={place.key} className={receivedSet.has(place.key) ? 'is-received' : ''} aria-pressed={receivedSet.has(place.key)} aria-label={`Place ${place.placeNumber}, ${receivedSet.has(place.key) ? 'received' : 'not received'}`} onClick={() => { toggleReceivedPlace(trip.tripId, place.key); setSelectedPlaceKey(place.key); setScanFeedback(undefined) }}>{place.placeNumber}</button>)}</div>
                {selectedPlace?.orderNumber === order.orderNumber ? <dl><div><dt>Place ID</dt><dd>{selectedPlace.key}</dd></div><div><dt>Dimensions</dt><dd>{selectedPlace.dimensions}</dd></div><div><dt>Est. weight</dt><dd>{selectedPlace.estimatedWeight} lb</dd></div></dl> : null}
                <button type="button" className="load-all" disabled={receivedCount === order.places.length} onClick={() => order.places.forEach((place) => receivePlace(trip.tripId, place.key))}>Receive all remaining ({order.places.length - receivedCount})</button>
              </div> : null}
            </article>
          })}
          {!visibleOrders.length ? <div className="unloading-empty">No manifest place matches this search.</div> : null}
        </section>
      </div>
      <div className="flow-action interstate-flow-action unloading-flow-action">
        <button type="button" className="mark-all-received" disabled={receivedPlaces.length === trip.placeCount} onClick={() => receiveAllPlaces(trip.tripId, trip.manifest.map((place) => place.key))}><CheckCheck size={19} /> {receivedPlaces.length === trip.placeCount ? 'All received' : 'Mark all received'}</button>
        <button type="button" className="cargo-primary" onClick={() => setReviewing(true)}>Review unloading · {receivedPlaces.length}/{trip.placeCount}</button>
      </div>
      <CargoBottomNav />
    </div>
  )
}