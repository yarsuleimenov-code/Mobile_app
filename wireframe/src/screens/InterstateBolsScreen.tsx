import { ChevronRight, FileText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { directionLabel, generatedTripToBol, interstateBolArchive, searchInterstateBols, type InterstateBolStatus } from '../interstateDomain'
import { useInterstate } from '../interstateStore'

type BolFilter = 'all' | InterstateBolStatus

const filters: { id: BolFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in_transit', label: 'In transit' },
  { id: 'closed', label: 'Closed' },
]

export function InterstateBolsScreen() {
  const navigate = useNavigate()
  const { generatedTrip } = useInterstate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<BolFilter>('all')
  const bols = useMemo(() => generatedTrip
    ? [generatedTripToBol(generatedTrip), ...interstateBolArchive.filter((bol) => bol.bolNumber !== generatedTrip.bolNumber)]
    : interstateBolArchive, [generatedTrip])
  const results = searchInterstateBols(bols, query, filter === 'all' ? undefined : filter)

  return (
    <div className="cargo-flow interstate-bols">
      <CargoFlowHeader title="Find BOL" subtitle="Interstate documents" />
      <div className="bols-body">
        <label className="bol-search"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="BOL, TripID, route or truck" autoFocus /><span>{results.length}</span></label>
        <div className="bol-filters" aria-label="BOL status filters">{filters.map((item) => <button type="button" key={item.id} className={filter === item.id ? 'is-active' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>

        <section className="bol-results" aria-live="polite">
          <h2>{query ? 'Search results' : 'Available BOLs'}</h2>
          {results.map((bol) => (
            <button type="button" key={bol.bolNumber} onClick={() => navigate(`/interstate/bol/${bol.bolNumber}`)}>
              <FileText />
              <span><strong>{bol.bolNumber}</strong><small>{bol.tripId}</small><small>{directionLabel(bol.direction)} · {bol.truck.split(' · ')[0]}</small></span>
              <span className="bol-result-meta"><em className={bol.status}>{bol.status === 'in_transit' ? 'In transit' : 'Closed'}</em><small>{bol.createdAt.split(' · ')[0]}</small></span>
              <ChevronRight />
            </button>
          ))}
          {!results.length ? <div className="bol-empty"><FileText /><strong>No BOL found</strong><span>Check the number or select another status.</span></div> : null}
        </section>
      </div>
      <CargoBottomNav />
    </div>
  )
}
