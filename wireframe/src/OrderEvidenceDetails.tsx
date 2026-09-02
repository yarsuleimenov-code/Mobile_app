import type { OrderEbolEvidenceSnapshot } from './orderEbolDomain'
import { specialCargoLabels } from './orderDetailsDomain'
import type { MeasurementSummary } from './measurementDomain'

export function MeasurementNotice({ summary }: { summary?: MeasurementSummary }) {
  if (!summary?.reasons.length) return null
  return <div className="measurement-warning"><strong>Measurements incomplete</strong>
    <p>{summary.incompletePlaces} places excluded from known volume · {summary.unknownWeightPlaces} with unknown weight.</p>
    {summary.reasons.map((item) => <p key={item.group}>Group {item.group} · {item.quantity} pcs · {item.dimensions}{item.weightUnknown ? ' · Weight not measured' : ''}<br />{item.reason || 'Reason required'}</p>)}
  </div>
}
export function OrderEvidenceDetails({ evidence }: { evidence: OrderEbolEvidenceSnapshot }) {
  const details = evidence.orderDetails
  return <>
    {details ? <div className="evidence-order-details"><strong>{details.internal_name || details.trade_name || 'Name not provided'}</strong>
      <span>Qty {evidence.pieceCount} pcs</span>
      <details><summary>Full order name & handling</summary><p>{details.trade_name || 'External name not received'}</p><small>Source: {details.name_source}</small>
        {details.special_cargo_type ? <p><b>{specialCargoLabels[details.special_cargo_type]}</b> · {details.special_cargo_details}</p> : null}
      </details>
    </div> : null}
    <MeasurementNotice summary={evidence.measurements} />
  </>
}
