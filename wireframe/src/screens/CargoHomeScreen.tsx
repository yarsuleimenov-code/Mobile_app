import { ArrowDown, ArrowUp, ChevronRight, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CargoShell } from '../cargo-components'
import { calculatePieces } from '../cargoDomain'
import { useCargo } from '../cargoStore'

export function CargoHomeScreen() {
  const navigate = useNavigate()
  const { records } = useCargo()

  return (
    <CargoShell>
      <div className="cargo-home">
        <h1>Record cargo</h1>
        <section className="cargo-actions" aria-label="Choose an operation">
          <button type="button" className="cargo-action cargo-action--pickup" onClick={() => navigate('/pickup')}>
            <ArrowUp size={46} /><strong>Pickup</strong><small>Measure and photograph</small>
          </button>
          <button type="button" className="cargo-action cargo-action--dropoff" onClick={() => navigate('/dropoff')}>
            <ArrowDown size={46} /><strong>Dropoff</strong><small>Find and verify</small>
          </button>
        </section>

        <section className="recent-records">
          <h2>Recent records</h2>
          {records.slice(0, 5).map((record) => (
            <button type="button" key={record.orderNumber} onClick={() => navigate(record.status === 'pickup_recorded' ? `/dropoff?order=${record.orderNumber}` : `/dropoff?order=${record.orderNumber}`)}>
              <span className={`record-direction record-direction--${record.status}`}><ArrowUp size={19} /></span>
              <span className="record-main"><strong>#{record.orderNumber}</strong><small>{record.pickupDate} · {calculatePieces(record.dimensionGroups)} pcs / {record.totalWeight} lb</small></span>
              <span className={`record-status record-status--${record.status}`}>{record.status === 'pickup_recorded' ? 'Pickup recorded' : 'Dropoff complete'}</span>
              <ChevronRight size={20} />
            </button>
          ))}
        </section>

        <div className="spoke-note"><ExternalLink size={19} /><span><strong>Today’s route stays in Spoke</strong><small>Open Zaberman only when recording a pickup or confirming a dropoff.</small></span></div>
      </div>
    </CargoShell>
  )
}
