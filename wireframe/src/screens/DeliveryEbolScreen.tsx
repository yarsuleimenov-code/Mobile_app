import { AlertTriangle, CheckCircle2, FileText, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import {
  canLockDeliveryEbol,
  type DeliveryEbolConfirmationInput, type OrderEbol, type OrderEbolEvidenceSnapshot,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'

function DeliveryEvidenceSummary({ evidence }: { evidence: OrderEbolEvidenceSnapshot }) {
  return (
    <dl className="ebol-evidence-summary">
      <div><dt>Pieces</dt><dd>{evidence.pieceCount}</dd></div>
      <div><dt>Weight</dt><dd>{evidence.totalWeight} lb</dd></div>
      <div><dt>Volume</dt><dd>{evidence.totalVolume.toFixed(2)} cu ft</dd></div>
      <div><dt>Photos</dt><dd>{evidence.photoCount}</dd></div>
    </dl>
  )
}

export function DeliveryEbolScreen() {
  const navigate = useNavigate()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const [orderEbol] = useState<OrderEbol | null>(() => findOrderEbol(readOrderEbols(), orderNumber) ?? null)
  const [contactMethod, setContactMethod] = useState<DeliveryEbolConfirmationInput['contactMethod']>(() => (
    orderEbol?.delivery.contact.status === 'contactless' ? 'contactless' : 'signed'
  ))
  const [contactName, setContactName] = useState(orderEbol?.delivery.contact.signerName ?? '')
  const [contactlessReason, setContactlessReason] = useState(orderEbol?.delivery.contact.contactlessReason ?? '')
  const [contactlessAcknowledged, setContactlessAcknowledged] = useState(false)
  const [driverName, setDriverName] = useState(orderEbol?.delivery.driver.signerName ?? '')

  if (!orderEbol?.pickup.lockedAt) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Delivery · Order #${orderNumber || 'unknown'}`} />
        <div className="ebol-not-found"><FileText size={42} /><h2>Pickup snapshot required</h2><p>Lock the Pickup snapshot before starting Delivery.</p><button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${orderNumber}/ebol/pickup`)}>Open Order eBOL</button></div>
        <CargoBottomNav />
      </div>
    )
  }

  if (!orderEbol.delivery.evidence) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Delivery · Order #${orderNumber}`} />
        <div className="ebol-not-found"><FileText size={42} /><h2>Delivery evidence required</h2><p>Complete Dropoff verification and capture Delivery photos first.</p><button type="button" className="cargo-primary" onClick={() => navigate(`/dropoff?order=${orderNumber}`)}>Open Dropoff</button></div>
        <CargoBottomNav />
      </div>
    )
  }

  const evidence = orderEbol.delivery.evidence
  const confirmationInput: DeliveryEbolConfirmationInput = {
    contactMethod,
    contactName,
    contactlessReason,
    contactlessAcknowledged,
    driverName,
    hasDamage: evidence.hasDamage,
    exceptionNote: evidence.exceptionNote,
  }

  if (orderEbol.delivery.lockedAt) {
    const contactLabel = orderEbol.delivery.contact.status === 'contactless'
      ? `Contactless · ${orderEbol.delivery.contact.contactlessReason}`
      : orderEbol.delivery.contact.signerName
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Completed · Order #${orderNumber}`} />
        <main className="delivery-ebol-body">
          <section className="ebol-locked-state"><span><LockKeyhole size={30} /></span><h2>Order eBOL completed</h2><p>Pickup and Delivery snapshots are locked.</p></section>
          <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>Delivery evidence</h2></div><DeliveryEvidenceSummary evidence={evidence} /><EvidenceGallery count={evidence.photoCount} photos={evidence.photos} />{evidence.hasDamage ? <div className="ebol-exception"><AlertTriangle size={20} /><span><strong>Exception documented</strong><small>{evidence.exceptionNote}</small></span></div> : <div className="ebol-clean"><CheckCircle2 size={20} /> No exception documented</div>}</section>
          <section className="ebol-section"><div className="ebol-section-heading"><ShieldCheck size={20} /><h2>Delivery confirmations</h2></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>{orderEbol.delivery.contact.status === 'contactless' ? 'Delivery contact · signature skipped' : 'Delivery contact'}</strong><small>{contactLabel}</small></span><CheckCircle2 size={21} /></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>Zaberman driver</strong><small>{orderEbol.delivery.driver.signerName}</small></span><CheckCircle2 size={21} /></div></section>
          <div className="delivery-pickup-reference"><CheckCircle2 size={20} /><span><strong>Pickup snapshot locked</strong><small>Pickup evidence and confirmations remain unchanged.</small></span></div>
          <p className="ebol-lock-note">Signed details cannot be edited. The final POD view is now available.</p>
          <div className="ebol-success-actions"><button type="button" className="cargo-primary" onClick={() => navigate(`/orders/${orderNumber}/ebol/pod`)}>View POD</button><button type="button" className="ebol-secondary" onClick={() => navigate('/')}>Back to Home</button></div>
        </main>
        <CargoBottomNav />
      </div>
    )
  }

  const openSigning = () => navigate(`/orders/${orderNumber}/ebol/delivery/sign`, {
    state: { confirmationInput },
  })

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Order eBOL" subtitle={`Delivery review · Order #${orderNumber}`} />
      <main className="delivery-ebol-body delivery-ebol-body--action">
        <div className="ebol-review-banner"><ShieldCheck size={24} /><span><strong>Review before signing</strong><small>Both parties should review the same Delivery evidence.</small></span></div>
        <div className="delivery-pickup-reference"><CheckCircle2 size={20} /><span><strong>Pickup snapshot locked</strong><small>Delivery confirmation completes this Order eBOL.</small></span></div>

        <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>Delivery evidence</h2></div><DeliveryEvidenceSummary evidence={evidence} /><EvidenceGallery count={evidence.photoCount} photos={evidence.photos} />{evidence.hasDamage ? <div className="ebol-exception"><AlertTriangle size={20} /><span><strong>Exception documented</strong><small>{evidence.exceptionNote}</small></span></div> : <div className="ebol-clean"><CheckCircle2 size={20} /> No exception documented</div>}</section>

        <div className="ebol-acknowledgement"><AlertTriangle size={20} /><p>Confirmations acknowledge review of the evidence and exceptions. They do not confirm absence of damage.</p></div>

        <section className="ebol-section">
          <div className="ebol-section-heading"><UserRound size={20} /><h2>Delivery contact</h2></div>
          <div className="ebol-method" aria-label="Delivery contact confirmation method"><button type="button" aria-pressed={contactMethod === 'signed'} className={contactMethod === 'signed' ? 'is-active' : ''} onClick={() => setContactMethod('signed')}>Sign on device</button><button type="button" aria-pressed={contactMethod === 'contactless'} className={contactMethod === 'contactless' ? 'is-active' : ''} onClick={() => setContactMethod('contactless')}>Contactless</button></div>
          {contactMethod === 'signed' ? <label className="ebol-field">Contact name<input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Full name" /></label> : (
            <div className="contactless-review">
              <label className="ebol-field">Contactless reason<select value={contactlessReason} onChange={(event) => setContactlessReason(event.target.value)}><option value="">Select reason</option><option>Contact unavailable</option><option>Contact refused to sign</option><option>Remote or unattended delivery</option></select></label>
              <div className="contactless-guidance"><AlertTriangle size={20} /><span><strong>Contact signature will be skipped</strong><small>The Zaberman driver must still sign the reviewed Delivery evidence.</small></span></div>
              <label className="contactless-attestation"><input type="checkbox" checked={contactlessAcknowledged} onChange={(event) => setContactlessAcknowledged(event.target.checked)} /><span>I confirm the selected reason is accurate and the contact signature cannot be collected.</span></label>
            </div>
          )}
        </section>

        <section className="ebol-section"><div className="ebol-section-heading"><UserRound size={20} /><h2>Zaberman driver</h2></div><label className="ebol-field">Driver name<input value={driverName} onChange={(event) => setDriverName(event.target.value)} placeholder="Full name" /></label></section>

        <div className="flow-action"><button type="button" className="cargo-primary" disabled={!canLockDeliveryEbol(confirmationInput)} onClick={openSigning}><FileText size={19} /> Continue to signing</button></div>
      </main>
      <CargoBottomNav />
    </div>
  )
}
