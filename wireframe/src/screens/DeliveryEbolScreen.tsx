import { AlertTriangle, CheckCircle2, FileText, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import {
  canReviewOrderEvidence, withCurrentOrderDetails, canLockDeliveryEbol,
  type DeliveryEbolConfirmationInput, type OrderEbol, type OrderEbolEvidenceSnapshot,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'
import { HandoffCommentsEditor, HandoffCommentsView, useHandoffComments } from '../orderReviewComments'
import { useCargo } from '../cargoStore'
import { OrderEvidenceDetails } from '../OrderEvidenceDetails'
import { weightText, volumeText } from '../measurementDomain'
import { OrderDocumentHistory } from '../OrderDocumentHistory'
import { DeliveryOtpVerification } from '../DeliveryOtpVerification'
import { otpRecipient } from '../deliveryOtpDomain'
import { usePrototypeScenario } from '../prototypeScenarioStore'
import { useCommunications } from '../communicationStore'

function DeliveryEvidenceSummary({ evidence }: { evidence: OrderEbolEvidenceSnapshot }) {
  return (
    <><OrderEvidenceDetails evidence={evidence} /><dl className="ebol-evidence-summary">
      <div><dt>Pieces</dt><dd>{evidence.pieceCount}</dd></div>
      <div><dt>Weight</dt><dd>{weightText(evidence.totalWeight, evidence.measurements)}</dd></div>
      <div><dt>Volume</dt><dd>{volumeText(evidence.totalVolume, evidence.measurements)}</dd></div>
      <div><dt>Photos</dt><dd>{evidence.photoCount}</dd></div>
    </dl></>
  )
}

export function DeliveryEbolScreen() {
  const { orderNumber } = useParams()
  return <DeliveryEbolContent key={orderNumber} />
}

function DeliveryEbolContent() {
  const navigate = useNavigate()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const { getOrderDetails } = useCargo()
  const { getThread } = useCommunications()
  const [orderEbol] = useState<OrderEbol | null>(() => withCurrentOrderDetails(findOrderEbol(readOrderEbols(), orderNumber) ?? null, 'delivery', getOrderDetails(orderNumber)))
  const communication = getThread(orderNumber)
  const recipient = communication?.operation === 'dropoff'
    ? { name: communication.customerName, phone: communication.customerPhone }
    : otpRecipient(orderNumber)
  const { otpOutcome, network } = usePrototypeScenario()
  const [contactMethod, setContactMethod] = useState<DeliveryEbolConfirmationInput['contactMethod']>(() => (
    orderEbol?.delivery.contact.status === 'otp' ? 'otp' : orderEbol?.delivery.contact.status === 'contactless' ? 'contactless' : 'signed'
  ))
  const [contactName, setContactName] = useState(orderEbol?.delivery.contact.signerName ?? '')
  const [otpVerified, setOtpVerified] = useState(orderEbol?.delivery.contact.status === 'otp')
  const [contactlessReason, setContactlessReason] = useState(orderEbol?.delivery.contact.contactlessReason ?? '')
  const [contactlessAcknowledged, setContactlessAcknowledged] = useState(false)
  const [driverName, setDriverName] = useState(orderEbol?.delivery.driver.signerName ?? '')
  const [hasDamage, setHasDamage] = useState(orderEbol?.delivery.evidence?.hasDamage ?? false)
  const [exceptionNote, setExceptionNote] = useState(orderEbol?.delivery.evidence?.exceptionNote ?? '')
  const { comments, changeComments, saveError } = useHandoffComments(orderEbol, 'delivery')
  const chooseContactMethod = (method: DeliveryEbolConfirmationInput['contactMethod']) => {
    if (method === contactMethod) return
    setContactMethod(method)
    setOtpVerified(false)
  }

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
    contactName: contactMethod === 'otp' ? recipient.name : contactName,
    contactlessReason,
    contactlessAcknowledged,
    driverName,
    hasDamage,
    exceptionNote,
    contactComment: comments.contact, driverComment: comments.driver,
    otpVerified,
    otpPhoneLast4: recipient.phone.replace(/\D/g, '').slice(-4),
  }

  if (orderEbol.delivery.lockedAt) {
    const contactLabel = orderEbol.delivery.contact.status === 'contactless'
      ? `Contactless · ${orderEbol.delivery.contact.contactlessReason}`
      : orderEbol.delivery.contact.status === 'otp'
        ? `${orderEbol.delivery.contact.signerName} · ••• ••• ${orderEbol.delivery.contact.otpPhoneLast4}`
        : orderEbol.delivery.contact.signerName
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Completed · Order #${orderNumber}`} />
        <main className="delivery-ebol-body">
          <section className="ebol-locked-state"><span><LockKeyhole size={30} /></span><h2>Order eBOL completed</h2><p>Pickup and Delivery snapshots are locked.</p></section>
          <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>Delivery evidence</h2></div><DeliveryEvidenceSummary evidence={evidence} /><EvidenceGallery count={evidence.photoCount} photos={evidence.photos} />{hasDamage ? <div className="ebol-exception"><AlertTriangle size={20} /><span><strong>Exception documented</strong><small>{exceptionNote || 'Add exception details below'}</small></span></div> : <div className="ebol-clean"><CheckCircle2 size={20} /> No exception documented</div>}</section>
          <section className="ebol-section"><div className="ebol-section-heading"><ShieldCheck size={20} /><h2>Delivery confirmations</h2></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>{orderEbol.delivery.contact.status === 'contactless' ? 'Delivery contact · signature skipped' : orderEbol.delivery.contact.status === 'otp' ? 'Delivery contact · OTP verified' : 'Delivery contact'}</strong><small>{contactLabel}</small></span><CheckCircle2 size={21} /></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>Zaberman driver</strong><small>{orderEbol.delivery.driver.signerName}</small></span><CheckCircle2 size={21} /></div></section>
          <div className="delivery-pickup-reference"><CheckCircle2 size={20} /><span><strong>Pickup snapshot locked</strong><small>Pickup evidence and confirmations remain unchanged.</small></span></div>
          <HandoffCommentsView comments={orderEbol.delivery.comments} />
          <OrderDocumentHistory order={orderEbol} />
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
        {!canReviewOrderEvidence(evidence) ? <p className="measurement-warning">Complete the internal name and handling details before signing. <button type="button" onClick={() => navigate(`/orders/${orderNumber}/details`)}>Open order details</button></p> : null}
        <div className="ebol-review-banner"><ShieldCheck size={24} /><span><strong>Review before signing</strong><small>Both parties should review the same Delivery evidence.</small></span></div>
        <div className="delivery-pickup-reference"><CheckCircle2 size={20} /><span><strong>Pickup snapshot locked</strong><small>Delivery confirmation completes this Order eBOL.</small></span></div>

        <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>Delivery evidence</h2></div><DeliveryEvidenceSummary evidence={evidence} /><EvidenceGallery count={evidence.photoCount} photos={evidence.photos} />{hasDamage ? <div className="ebol-exception"><AlertTriangle size={20} /><span><strong>Exception documented</strong><small>{exceptionNote || 'Add exception details below'}</small></span></div> : <div className="ebol-clean"><CheckCircle2 size={20} /> No exception documented</div>}</section>

        <section className="ebol-section ebol-exception-editor">
          <label><input type="checkbox" checked={hasDamage} disabled={evidence.hasDamage} onChange={(event) => setHasDamage(event.target.checked)} /><span><strong>Damage, disagreement or other exception</strong><small>Recorded delivery exceptions remain part of this handoff.</small></span></label>
          {hasDamage ? <textarea aria-label="Damage or exception details" rows={3} value={exceptionNote} onChange={(event) => setExceptionNote(event.target.value)} placeholder="Describe damage, refusal or disagreement" /> : null}
        </section>
        <div className="ebol-acknowledgement"><AlertTriangle size={20} /><p>Confirmations acknowledge review of the evidence and exceptions. They do not confirm absence of damage.</p></div>

        <section className="ebol-section">
          <div className="ebol-section-heading"><UserRound size={20} /><h2>Delivery contact</h2></div>
          <div className="ebol-method ebol-method--three" aria-label="Delivery contact confirmation method"><button type="button" aria-pressed={contactMethod === 'signed'} className={contactMethod === 'signed' ? 'is-active' : ''} onClick={() => chooseContactMethod('signed')}>Sign on device</button><button type="button" aria-pressed={contactMethod === 'otp'} className={contactMethod === 'otp' ? 'is-active' : ''} onClick={() => chooseContactMethod('otp')}>SMS code</button><button type="button" aria-pressed={contactMethod === 'contactless'} className={contactMethod === 'contactless' ? 'is-active' : ''} onClick={() => chooseContactMethod('contactless')}>Contactless</button></div>
          {contactMethod === 'signed' ? <label className="ebol-field">Contact name<input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Full name" /></label> : contactMethod === 'otp' ? (
            <DeliveryOtpVerification recipientName={recipient.name} recipientPhone={recipient.phone} outcome={otpOutcome} offline={network === 'offline'} onVerifiedChange={setOtpVerified} />
          ) : (
            <div className="contactless-review">
              <label className="ebol-field">Contactless reason<select value={contactlessReason} onChange={(event) => { setContactlessReason(event.target.value); if (event.target.value === 'Contact refused to sign') setHasDamage(true) }}><option value="">Select reason</option><option>Contact unavailable</option><option>Contact refused to sign</option><option>Remote or unattended delivery</option></select></label>
              <div className="contactless-guidance"><AlertTriangle size={20} /><span><strong>Contact signature will be skipped</strong><small>The Zaberman driver must still sign the reviewed Delivery evidence.</small></span></div>
              {contactlessReason === 'Contact refused to sign' ? <p className="ebol-storage-warning">Describe the refusal in the exception details above before continuing.</p> : null}
              <label className="contactless-attestation"><input type="checkbox" checked={contactlessAcknowledged} onChange={(event) => setContactlessAcknowledged(event.target.checked)} /><span>I confirm the selected reason is accurate and the contact signature cannot be collected.</span></label>
            </div>
          )}
        </section>

        <section className="ebol-section"><div className="ebol-section-heading"><UserRound size={20} /><h2>Zaberman driver</h2></div><label className="ebol-field">Driver name<input value={driverName} onChange={(event) => setDriverName(event.target.value)} placeholder="Full name" /></label></section>

        <HandoffCommentsEditor comments={comments} onChange={changeComments} saveError={saveError} />
        <div className="flow-action"><button type="button" className="cargo-primary" disabled={(!canLockDeliveryEbol(confirmationInput) || !canReviewOrderEvidence(evidence))} onClick={openSigning}><FileText size={19} /> {contactMethod === 'otp' ? 'Continue to driver signature' : 'Continue to signing'}</button></div>
      </main>
      <CargoBottomNav />
    </div>
  )
}
