import { Check, ChevronDown, ChevronUp, CircleAlert, ScanLine, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { useCargo } from '../cargoStore'
import { directionLabel, expandRecordPlaces, getEligibleRecords, summarizeLoadedPlaces } from '../interstateDomain'
import { useInterstate } from '../interstateStore'
type ScanFeedback = { type: 'success' | 'error'; message: string }

export function InterstateLoadingScreen() {
  const navigate = useNavigate()
  const { records } = useCargo()
  const { direction, truck, loadedPlaceKeys, togglePlace, loadAll } = useInterstate()
  const eligible = getEligibleRecords(records, direction)
  const allPlaces = eligible.flatMap(expandRecordPlaces)
  const loadedSet = new Set(loadedPlaceKeys)
  const selectedPlaces = allPlaces.filter((place) => loadedSet.has(place.placeId))
  const summary = summarizeLoadedPlaces(selectedPlaces)
  const [query, setQuery] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(eligible[0]?.orderNumber ?? '')
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<string>()
  const visibleRecords = useMemo(() => eligible.filter((record) => `${record.orderNumber} ${record.title} ${expandRecordPlaces(record).map((place) => place.placeId).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [eligible, query])
  const [scanValue, setScanValue] = useState('')
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback>()
  const selectedPlace = allPlaces.find((place) => place.placeId === selectedPlaceKey)

  const submitScan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedId = scanValue.trim().toLowerCase()
    const place = allPlaces.find((item) => item.placeId.toLowerCase() === normalizedId)
    if (!place) {
      setScanFeedback({ type: 'error', message: 'Place ID is not available for this Interstate load.' })
      return
    }
    if (loadedSet.has(place.placeId)) {
      setScanFeedback({ type: 'success', message: `${place.placeId} was already loaded.` })
    } else {
      loadAll([place])
      setScanFeedback({ type: 'success', message: `${place.placeId} loaded.` })
    }
    setExpandedOrder(place.orderNumber)
    setSelectedPlaceKey(place.placeId)
    setScanValue('')
  }

  return (
    <div className="cargo-flow interstate-loading">
      <CargoFlowHeader title="Load Interstate" subtitle={`${directionLabel(direction)} · ${truck.replace(' · 26 ft', '')}`} />
      <div className="loading-body">
        <section className="loading-progress">
          <strong>{summary.placeCount} of {allPlaces.length} places loaded</strong>
          <div><span style={{ width: `${allPlaces.length ? (summary.placeCount / allPlaces.length) * 100 : 0}%` }} /></div>
          <dl><div><dt>Loaded weight</dt><dd>{summary.loadedWeight} lb</dd></div><div><dt>Loaded volume</dt><dd>{summary.loadedVolume.toFixed(2)} cu ft</dd></div></dl>
        </section>
        <form className="unloading-scan" onSubmit={submitScan}>
          <ScanLine size={21} />
          <input aria-label="Scan Place ID to load" placeholder="Scan or enter Place ID" value={scanValue} onChange={(event) => setScanValue(event.target.value)} autoCapitalize="characters" />
          <button type="submit" disabled={!scanValue.trim()}>Load</button>
        </form>
        {scanFeedback ? <div className={`scan-feedback is-${scanFeedback.type}`} aria-live="polite">{scanFeedback.type === 'success' ? <Check /> : <CircleAlert />}<span>{scanFeedback.message}</span></div> : null}

        <label className="loading-search"><Search size={19} /><input aria-label="Search orders" placeholder="Search by order #, item or Place ID" value={query} onChange={(event) => setQuery(event.target.value)} /></label>

        <section className="loading-orders">
          {visibleRecords.map((record) => {
            const places = expandRecordPlaces(record)
            const loadedCount = places.filter((place) => loadedSet.has(place.placeId)).length
            const expanded = expandedOrder === record.orderNumber
            return <article key={record.orderNumber} className={expanded ? 'is-expanded' : ''}>
              <button type="button" className="loading-order-head" onClick={() => setExpandedOrder(expanded ? '' : record.orderNumber)}><span><strong>#{record.orderNumber}</strong><small>{record.title}</small></span><em>{loadedCount} / {places.length} places</em>{expanded ? <ChevronUp /> : <ChevronDown />}</button>
              {expanded ? <div className="place-picker">
                <div>{places.map((place) => <button type="button" key={place.placeId} className={loadedSet.has(place.placeId) ? 'is-loaded' : ''} onClick={() => { togglePlace(place.placeId); setSelectedPlaceKey(place.placeId) }}>{place.placeNumber}</button>)}</div>
                {selectedPlace?.orderNumber === record.orderNumber ? <dl><div><dt>Selected place</dt><dd>{selectedPlace.placeNumber}</dd></div><div><dt>Dimensions</dt><dd>{selectedPlace.dimensions}</dd></div><div><dt>Est. weight</dt><dd>{selectedPlace.estimatedWeight} lb</dd></div></dl> : null}
                <button type="button" className="load-all" onClick={() => loadAll(places)}>Load all remaining ({places.length - loadedCount})</button>
              </div> : null}
            </article>
          })}
        </section>
      </div>
      <div className="flow-action interstate-flow-action"><button type="button" className="cargo-primary" disabled={!summary.placeCount} onClick={() => navigate('/interstate/review')}>Review {summary.placeCount} loaded {summary.placeCount === 1 ? 'place' : 'places'}</button></div>
      <CargoBottomNav />
    </div>
  )
}
