import { AlertTriangle, CheckCircle2, UserRound } from 'lucide-react'
import { EvidenceGallery } from './cargo-components'
import type { OrderEbolHandoffSnapshot } from './orderEbolDomain'
import { formatDocumentTime as formatTimestamp } from './orderDocumentDomain'
import { OrderEvidenceDetails } from './OrderEvidenceDetails'
import { weightText, volumeText } from './measurementDomain'
import { HandoffCommentsView } from './orderReviewComments'

export function ContactFollowUpReason({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <>
    <label className="ebol-field">Reason (required)<textarea rows={3} maxLength={1000} required value={value} onChange={(event) => onChange(event.target.value)} /></label>
    <p className="measurement-warning">Use this only if the cargo was handed over. Dispatch will follow up for contact confirmation.</p>
  </>
}

export function ContactFollowUpNotice({ reason }: { reason?: string }) {
  return <div className="measurement-warning contact-follow-up-notice">
    <strong>Contact confirmation pending</strong>
    {reason ? <p>{reason}</p> : null}
  </div>
}

export function PodHandoffSection({ title, snapshot }: { title: string; snapshot: OrderEbolHandoffSnapshot }) {
  const evidence = snapshot.evidence
  if (!evidence) return null
  const otp = snapshot.contact.status === 'otp'
  const contactValue = otp
      ? `${snapshot.contact.signerName} · ••• ••• ${snapshot.contact.otpPhoneLast4}`
      : snapshot.contact.signerName

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
      {snapshot.contact.status === 'follow_up' ? <ContactFollowUpNotice reason={snapshot.contact.followUpReason} /> :
        <div className="pod-confirmation"><UserRound size={19} /><span><strong>{title} contact{otp ? ' · OTP verified' : ''}</strong><small>{contactValue} · {formatTimestamp(snapshot.contact.confirmedAt)}</small></span><CheckCircle2 size={19} /></div>}
      <div className="pod-confirmation"><UserRound size={19} /><span><strong>Zaberman driver</strong><small>{snapshot.driver.signerName} · {formatTimestamp(snapshot.driver.confirmedAt)}</small></span><CheckCircle2 size={19} /></div>
      <HandoffCommentsView comments={snapshot.comments} />
    </section>
  )
}
