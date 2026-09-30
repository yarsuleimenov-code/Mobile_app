import { AlertTriangle, CheckCircle2, FilePlus2, FileText, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import {
  canReviewOrderEvidence, withCurrentOrderDetails, canLockPickupEbol, createOrderEbol, findDraftSupplementalPickup,
  type OrderEbol, type OrderEbolEvidenceSnapshot, type PickupEbolConfirmationInput,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'
import { HandoffCommentsEditor, HandoffCommentsView, useHandoffComments } from '../orderReviewComments'
import { OrderEvidenceDetails } from '../OrderEvidenceDetails'
import { weightText, volumeText } from '../measurementDomain'
import { pickupReviewNeedsRefresh } from '../pickupReviewState'
import { readPickupDrafts } from '../pickupDraftStore'
import { OrderDocumentHistory } from '../OrderDocumentHistory'
import { PickupEmailDeliveryStatus } from '../PickupEmailDeliveryStatus'
import { DeliveryOtpVerification } from '../DeliveryOtpVerification'
import { otpRecipient } from '../deliveryOtpDomain'
import { usePrototypeScenario } from '../prototypeScenarioStore'
import { useCommunications } from '../communicationStore'

function EvidenceSummary({ evidence }: { evidence: OrderEbolEvidenceSnapshot }) {
  return (
    <><OrderEvidenceDetails evidence={evidence} /><dl className="ebol-evidence-summary">
      <div><dt>Pieces</dt><dd>{evidence.pieceCount}</dd></div>
      <div><dt>Weight</dt><dd>{weightText(evidence.totalWeight, evidence.measurements)}</dd></div>
      <div><dt>Volume</dt><dd>{volumeText(evidence.totalVolume, evidence.measurements)}</dd></div>
      <div><dt>Photos</dt><dd>{evidence.photoCount}</dd></div>
    </dl></>
  )
}

export function PickupEbolScreen() {
  const { orderNumber } = useParams()
  return <PickupEbolContent key={orderNumber} />
}

function PickupEbolContent() {
  const navigate = useNavigate()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const { findRecord, getOrderDetails } = useCargo()
  const { getThread } = useCommunications()
  const { otpOutcome, network } = usePrototypeScenario()
  const record = findRecord(orderNumber)
  const communication = getThread(orderNumber)
  const recipient = communication
    ? { name: communication.customerName, phone: communication.customerPhone }
    : otpRecipient(orderNumber)
  const [orderEbol] = useState<OrderEbol | null>(() => {
    const current = findOrderEbol(readOrderEbols(), orderNumber) ?? (record ? createOrderEbol(record) : null)
    return withCurrentOrderDetails(current, findDraftSupplementalPickup(current)?.version ?? 'pickup', getOrderDetails(orderNumber))
  })
  const supplementalDraft = findDraftSupplementalPickup(orderEbol)
  const confirmationSource = supplementalDraft ?? orderEbol?.pickup
  const [contactMethod, setContactMethod] = useState<PickupEbolConfirmationInput['contactMethod']>(() => (
    confirmationSource?.contact.status === 'otp' ? 'otp' : 'signed'
  ))
  const [contactName, setContactName] = useState(confirmationSource?.contact.signerName ?? '')
  const [otpVerified, setOtpVerified] = useState(confirmationSource?.contact.status === 'otp')
  const [driverName, setDriverName] = useState(confirmationSource?.driver.signerName ?? '')
  const [hasDamage, setHasDamage] = useState(confirmationSource?.evidence?.hasDamage ?? false)
  const [exceptionNote, setExceptionNote] = useState(confirmationSource?.evidence?.exceptionNote ?? '')
  const { comments, changeComments, saveError } = useHandoffComments(orderEbol, supplementalDraft?.version ?? 'pickup')
  const chooseContactMethod = (method: PickupEbolConfirmationInput['contactMethod']) => {
    if (method === contactMethod) return
    setContactMethod(method)
    setOtpVerified(false)
  }

  if (!orderEbol?.pickup.evidence) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Pickup · Order #${orderNumber || 'unknown'}`} />
        <div className="ebol-not-found"><FileText size={42} /><h2>Pickup record not found</h2><p>Save the Pickup record before starting its Order eBOL.</p><button type="button" className="cargo-primary" onClick={() => navigate(`/pickup?order=${orderNumber}`)}>Open Pickup</button></div>
        <CargoBottomNav />
      </div>
    )
  }

  const evidence = orderEbol.pickup.evidence
  const reviewEvidence = supplementalDraft?.evidence ?? evidence
  const isLocked = Boolean(orderEbol.pickup.lockedAt)
  const confirmationInput: PickupEbolConfirmationInput = {
    contactMethod, contactName: contactMethod === 'otp' ? recipient.name : contactName,
    otpVerified, otpPhoneLast4: recipient.phone.replace(/\D/g, '').slice(-4), driverName, hasDamage, exceptionNote,
    contactComment: comments.contact, driverComment: comments.driver,
  }
  const needsRefresh = pickupReviewNeedsRefresh(orderEbol, readPickupDrafts())
  const canConfirm = !needsRefresh && canLockPickupEbol(confirmationInput) && canReviewOrderEvidence(reviewEvidence)

  const openSigning = () => navigate(`/orders/${orderNumber}/ebol/pickup/sign`, {
    state: { confirmationInput, supplementVersion: supplementalDraft?.version },
  })

  if (isLocked && !supplementalDraft) {
    const contactLabel = orderEbol.pickup.contact.status === 'otp'
      ? `${orderEbol.pickup.contact.signerName} · ••• ••• ${orderEbol.pickup.contact.otpPhoneLast4}`
      : orderEbol.pickup.contact.signerName
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Pickup locked · Order #${orderNumber}`} />
        <main className="pickup-ebol-body">
          <section className="ebol-locked-state"><span><LockKeyhole size={30} /></span><h2>Pickup snapshot locked</h2><p>Version 1 and its confirmations cannot be edited.</p></section>
          <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>Pickup evidence</h2></div><EvidenceSummary evidence={evidence} /><EvidenceGallery count={evidence.photoCount} photos={evidence.photos} />{evidence.hasDamage ? <div className="ebol-exception"><AlertTriangle size={20} /><span><strong>Exception documented</strong><small>{evidence.exceptionNote}</small></span></div> : <div className="ebol-clean"><CheckCircle2 size={20} /> No exception documented</div>}</section>
          <section className="ebol-section"><div className="ebol-section-heading"><ShieldCheck size={20} /><h2>Confirmations</h2></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>{orderEbol.pickup.contact.status === 'otp' ? 'Pickup contact · OTP verified' : 'Pickup contact'}</strong><small>{contactLabel}</small></span><CheckCircle2 size={21} /></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>Zaberman driver</strong><small>{orderEbol.pickup.driver.signerName}</small></span><CheckCircle2 size={21} /></div></section>
          <PickupEmailDeliveryStatus documentNumber={`${orderNumber}-PU-1`} request={orderEbol.pickup.contact.emailCopyRequest} />
          <HandoffCommentsView comments={orderEbol.pickup.comments} />
          <OrderDocumentHistory order={orderEbol} />
          {(orderEbol.pickupSupplements ?? []).filter((item) => item.status === 'locked' && item.evidence).map((item) => (
            <section className="ebol-section" key={item.version}><h2>Version {item.version} · Supplemental photos</h2>
              <p>{item.documentNumber} · locked evidence</p>
              <EvidenceGallery count={item.evidence!.photoCount} photos={item.evidence!.photos} />
              <HandoffCommentsView comments={item.comments} />
              <PickupEmailDeliveryStatus documentNumber={item.documentNumber} request={item.contact.emailCopyRequest} />
            </section>
          ))}
          <p className="ebol-lock-note">Previously signed facts stay unchanged. Add physical places through a Supplemental Pickup with a new document version and new confirmations.</p>
          <button type="button" className="ebol-secondary ebol-add-supplement" onClick={() => navigate(`/pickup?order=${orderNumber}&supplemental=1`)}><FilePlus2 size={19} /> Add places · Supplemental Pickup</button>
          <div className="ebol-success-actions"><button type="button" className="cargo-primary" onClick={() => navigate(orderEbol.delivery.lockedAt ? `/orders/${orderNumber}/ebol/pod` : `/dropoff?order=${orderNumber}`)}>{orderEbol.delivery.lockedAt ? 'View POD' : 'Continue to Dropoff'}</button><button type="button" className="ebol-secondary" onClick={() => navigate('/')}>Back to Home</button></div>
        </main>
        <CargoBottomNav />
      </div>
    )
  }

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Order eBOL" subtitle={supplementalDraft ? `Supplemental Pickup · Version ${supplementalDraft.version}` : `Pickup review · Order #${orderNumber}`} />
      <main className="pickup-ebol-body pickup-ebol-body--action">
        {needsRefresh ? <div className="measurement-warning" role="alert"><p>The Pickup draft has changed. Update this review before signing.</p><button type="button" onClick={() => navigate(`/pickup?order=${orderNumber}${supplementalDraft ? '&supplemental=1' : ''}`)}>Return to Pickup draft</button></div> : null}
        {!canReviewOrderEvidence(reviewEvidence) ? <p className="measurement-warning">Complete the internal name, handling details and measurement reasons before signing. <button type="button" onClick={() => navigate(`/orders/${orderNumber}/details`)}>Open order details</button></p> : null}
        <div className="ebol-review-banner"><ShieldCheck size={24} /><span><strong>{supplementalDraft ? `Review ${supplementalDraft.addedPlaceIds.length} added places` : 'Review before signing'}</strong><small>{supplementalDraft ? 'Version 1 remains locked. These additions require fresh confirmations.' : 'Both parties should review the same Pickup evidence.'}</small></span></div>

        <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>{supplementalDraft ? `Version ${supplementalDraft.version} evidence` : 'Pickup evidence'}</h2></div><EvidenceSummary evidence={reviewEvidence} /><EvidenceGallery count={reviewEvidence.photoCount} photos={reviewEvidence.photos} />{supplementalDraft ? <div className="supplemental-place-ids">{supplementalDraft.addedPlaceIds.map((placeId) => <code key={placeId}>{placeId}</code>)}</div> : null}</section>

        <section className="ebol-section ebol-exception-editor">
          <label><input type="checkbox" checked={hasDamage} onChange={(event) => setHasDamage(event.target.checked)} /><span><strong>Damage, disagreement or other exception</strong><small>Damage does not block handoff when it is documented.</small></span></label>
          {hasDamage ? <textarea aria-label="Damage or exception details" rows={3} value={exceptionNote} onChange={(event) => setExceptionNote(event.target.value)} placeholder="Describe damage, packaging issue or other exception" /> : null}
        </section>

        <div className="ebol-acknowledgement"><AlertTriangle size={20} /><p>Confirmations acknowledge review of the evidence and exceptions. They do not confirm absence of damage.</p></div>

        <section className="ebol-section">
          <div className="ebol-section-heading"><UserRound size={20} /><h2>Pickup contact</h2></div>
          <div className="ebol-method" aria-label="Pickup contact confirmation method"><button type="button" aria-pressed={contactMethod === 'signed'} className={contactMethod === 'signed' ? 'is-active' : ''} onClick={() => chooseContactMethod('signed')}>Sign on device</button><button type="button" aria-pressed={contactMethod === 'otp'} className={contactMethod === 'otp' ? 'is-active' : ''} onClick={() => chooseContactMethod('otp')}>SMS code</button></div>
          {contactMethod === 'signed' ? <label className="ebol-field">Contact name<input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Full name" /></label> : (
            <DeliveryOtpVerification recipientName={recipient.name} recipientPhone={recipient.phone} outcome={otpOutcome} offline={network === 'offline'} onVerifiedChange={setOtpVerified} />
          )}
        </section>

        <section className="ebol-section">
          <div className="ebol-section-heading"><UserRound size={20} /><h2>Zaberman driver</h2></div>
          <label className="ebol-field">Driver name<input value={driverName} onChange={(event) => setDriverName(event.target.value)} placeholder="Full name" /></label>
        </section>

        <HandoffCommentsEditor comments={comments} onChange={changeComments} saveError={saveError} />
        {supplementalDraft ? <OrderDocumentHistory order={orderEbol} /> : null}
        <div className="flow-action"><button type="button" className="cargo-primary" disabled={!canConfirm} onClick={openSigning}><FileText size={19} /> {contactMethod === 'otp' ? 'Continue to driver signature' : 'Continue to signing'}</button></div>
      </main>
      <CargoBottomNav />
    </div>
  )
}
