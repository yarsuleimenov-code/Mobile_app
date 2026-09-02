import { AlertTriangle, CheckCircle2, UserRound } from 'lucide-react'
import { EvidenceGallery } from './cargo-components'
import type { OrderEbolHandoffSnapshot } from './orderEbolDomain'
import { formatDocumentTime as formatTimestamp } from './orderDocumentDomain'
import { OrderEvidenceDetails } from './OrderEvidenceDetails'
import { weightText, volumeText } from './measurementDomain'
import { HandoffCommentsView } from './orderReviewComments'

export function PodHandoffSection({ title, snapshot }: { title: string; snapshot: OrderEbolHandoffSnapshot }) {
  const evidence = snapshot.evidence
  if (!evidence) return null
  const contactless = snapshot.contact.status === 'contactless'
  const contactValue = contactless ? snapshot.contact.contactlessReason : snapshot.contact.signerName

  return (
    <section className="pod-handoff">
      <div className="pod-handoff-heading"><span>{title}</span><small>Locked {formatTimestamp(snapshot.lockedAt)}</small></div>
      <OrderEvidenceDetails evidence={evidence} />
      <dl className="pod-metrics">
        <div><dt>Pieces</dt><dd>{evidence.pieceCount}</dd></div>
        <div><dt>Weight</dt><dd>{weightText(evidence.totalWeight, evidence.measurements)}</dd></div>
        <div><dt>Volume</dt><dd>{volumeText(evidence.totalVolume, evidence.measurements)}</dd></div>
        <div><dt>Photos</dt><dd>{evidence.photoCount}</dd></div>
      </dl>
      <details className="document-place-list"><summary>Included places ({evidence.placeIds.length})</summary><div>{evidence.placeIds.map((id) => <code key={id}>{id}</code>)}</div></details>
      <EvidenceGallery count={evidence.photoCount} photos={evidence.photos} />
      {evidence.hasDamage ? <div className="pod-exception"><AlertTriangle size={18} /><span><strong>Exception documented</strong><small>{evidence.exceptionNote}</small></span></div> : <div className="pod-no-exception"><CheckCircle2 size={18} /> No exception documented</div>}
      <div className="pod-confirmation"><UserRound size={19} /><span><strong>{title} contact{contactless ? ' · signature skipped' : ''}</strong><small>{contactValue} · {formatTimestamp(snapshot.contact.confirmedAt)}</small></span><CheckCircle2 size={19} /></div>
      <div className="pod-confirmation"><UserRound size={19} /><span><strong>Zaberman driver</strong><small>{snapshot.driver.signerName} · {formatTimestamp(snapshot.driver.confirmedAt)}</small></span><CheckCircle2 size={19} /></div>
      <HandoffCommentsView comments={snapshot.comments} />
    </section>
  )
}
