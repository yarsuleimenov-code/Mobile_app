import { AlertTriangle, CheckCircle2, FileText, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader, EvidenceGallery } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import {
  canLockPickupEbol, createOrderEbol,
  type OrderEbol, type OrderEbolEvidenceSnapshot, type PickupEbolConfirmationInput,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols } from '../orderEbolStore'

function EvidenceSummary({ evidence }: { evidence: OrderEbolEvidenceSnapshot }) {
  return (
    <dl className="ebol-evidence-summary">
      <div><dt>Pieces</dt><dd>{evidence.pieceCount}</dd></div>
      <div><dt>Weight</dt><dd>{evidence.totalWeight} lb</dd></div>
      <div><dt>Volume</dt><dd>{evidence.totalVolume.toFixed(2)} cu ft</dd></div>
      <div><dt>Photos</dt><dd>{evidence.photoCount}</dd></div>
    </dl>
  )
}

export function PickupEbolScreen() {
  const navigate = useNavigate()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const { findRecord } = useCargo()
  const record = findRecord(orderNumber)
  const [orderEbol] = useState<OrderEbol | null>(() => (
    findOrderEbol(readOrderEbols(), orderNumber) ?? (record ? createOrderEbol(record) : null)
  ))
  const [contactMethod, setContactMethod] = useState<PickupEbolConfirmationInput['contactMethod']>(() => (
    orderEbol?.pickup.contact.status === 'contactless' ? 'contactless' : 'signed'
  ))
  const [contactName, setContactName] = useState(orderEbol?.pickup.contact.signerName ?? '')
  const [contactlessReason, setContactlessReason] = useState(orderEbol?.pickup.contact.contactlessReason ?? '')
  const [contactlessAcknowledged, setContactlessAcknowledged] = useState(false)
  const [driverName, setDriverName] = useState(orderEbol?.pickup.driver.signerName ?? '')
  const [hasDamage, setHasDamage] = useState(orderEbol?.pickup.evidence?.hasDamage ?? false)
  const [exceptionNote, setExceptionNote] = useState(orderEbol?.pickup.evidence?.exceptionNote ?? '')

  if (!orderEbol?.pickup.evidence) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Pickup · Order #${orderNumber || 'unknown'}`} />
        <div className="ebol-not-found"><FileText size={42} /><h2>Pickup record not found</h2><p>Save the Pickup record before starting its Order eBOL.</p><button type="button" className="cargo-primary" onClick={() => navigate('/pickup')}>Open Pickup</button></div>
        <CargoBottomNav />
      </div>
    )
  }

  const evidence = orderEbol.pickup.evidence
  const isLocked = Boolean(orderEbol.pickup.lockedAt)
  const confirmationInput: PickupEbolConfirmationInput = {
    contactMethod, contactName, contactlessReason, contactlessAcknowledged, driverName, hasDamage, exceptionNote,
  }
  const canConfirm = canLockPickupEbol(confirmationInput)

  const openSigning = () => navigate(`/orders/${orderNumber}/ebol/pickup/sign`, {
    state: { confirmationInput },
  })

  if (isLocked) {
    const contactLabel = orderEbol.pickup.contact.status === 'contactless'
      ? `Contactless · ${orderEbol.pickup.contact.contactlessReason}`
      : orderEbol.pickup.contact.signerName
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL" subtitle={`Pickup locked · Order #${orderNumber}`} />
        <main className="pickup-ebol-body">
          <section className="ebol-locked-state"><span><LockKeyhole size={30} /></span><h2>Pickup snapshot locked</h2><p>Evidence and confirmations are saved for this handoff.</p></section>
          <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>Pickup evidence</h2></div><EvidenceSummary evidence={evidence} /><EvidenceGallery count={evidence.photoCount} />{evidence.hasDamage ? <div className="ebol-exception"><AlertTriangle size={20} /><span><strong>Exception documented</strong><small>{evidence.exceptionNote}</small></span></div> : <div className="ebol-clean"><CheckCircle2 size={20} /> No exception documented</div>}</section>
          <section className="ebol-section"><div className="ebol-section-heading"><ShieldCheck size={20} /><h2>Confirmations</h2></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>{orderEbol.pickup.contact.status === 'contactless' ? 'Pickup contact · signature skipped' : 'Pickup contact'}</strong><small>{contactLabel}</small></span><CheckCircle2 size={21} /></div><div className="ebol-confirmed-row"><UserRound size={20} /><span><strong>Zaberman driver</strong><small>{orderEbol.pickup.driver.signerName}</small></span><CheckCircle2 size={21} /></div></section>
          <p className="ebol-lock-note">Locked data cannot be edited in the prototype. A correction requires a separate request.</p>
          <button type="button" className="cargo-primary" onClick={() => navigate('/')}>Back to Home</button>
        </main>
        <CargoBottomNav />
      </div>
    )
  }

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Order eBOL" subtitle={`Pickup review · Order #${orderNumber}`} />
      <main className="pickup-ebol-body pickup-ebol-body--action">
        <div className="ebol-review-banner"><ShieldCheck size={24} /><span><strong>Review before signing</strong><small>Both parties should review the same Pickup evidence.</small></span></div>

        <section className="ebol-section"><div className="ebol-section-heading"><FileText size={20} /><h2>Pickup evidence</h2></div><EvidenceSummary evidence={evidence} /><EvidenceGallery count={evidence.photoCount} /></section>

        <section className="ebol-section ebol-exception-editor">
          <label><input type="checkbox" checked={hasDamage} onChange={(event) => setHasDamage(event.target.checked)} /><span><strong>Damage or exception observed</strong><small>Damage does not block handoff when it is documented.</small></span></label>
          {hasDamage ? <textarea aria-label="Damage or exception details" rows={3} value={exceptionNote} onChange={(event) => setExceptionNote(event.target.value)} placeholder="Describe damage, packaging issue or other exception" /> : null}
        </section>

        <div className="ebol-acknowledgement"><AlertTriangle size={20} /><p>Confirmations acknowledge review of the evidence and exceptions. They do not confirm absence of damage.</p></div>

        <section className="ebol-section">
          <div className="ebol-section-heading"><UserRound size={20} /><h2>Pickup contact</h2></div>
          <div className="ebol-method" aria-label="Pickup contact confirmation method"><button type="button" aria-pressed={contactMethod === 'signed'} className={contactMethod === 'signed' ? 'is-active' : ''} onClick={() => setContactMethod('signed')}>Sign on device</button><button type="button" aria-pressed={contactMethod === 'contactless'} className={contactMethod === 'contactless' ? 'is-active' : ''} onClick={() => setContactMethod('contactless')}>Contactless</button></div>
          {contactMethod === 'signed' ? <label className="ebol-field">Contact name<input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Full name" /></label> : (
            <div className="contactless-review">
              <label className="ebol-field">Contactless reason<select value={contactlessReason} onChange={(event) => setContactlessReason(event.target.value)}><option value="">Select reason</option><option>Contact unavailable</option><option>Contact refused to sign</option><option>Remote or unattended pickup</option></select></label>
              <div className="contactless-guidance"><AlertTriangle size={20} /><span><strong>Contact signature will be skipped</strong><small>The Zaberman driver must still sign the reviewed Pickup evidence.</small></span></div>
              <label className="contactless-attestation"><input type="checkbox" checked={contactlessAcknowledged} onChange={(event) => setContactlessAcknowledged(event.target.checked)} /><span>I confirm the selected reason is accurate and the contact signature cannot be collected.</span></label>
            </div>
          )}
        </section>

        <section className="ebol-section">
          <div className="ebol-section-heading"><UserRound size={20} /><h2>Zaberman driver</h2></div>
          <label className="ebol-field">Driver name<input value={driverName} onChange={(event) => setDriverName(event.target.value)} placeholder="Full name" /></label>
        </section>

        <div className="flow-action"><button type="button" className="cargo-primary" disabled={!canConfirm} onClick={openSigning}><FileText size={19} /> Continue to signing</button></div>
      </main>
      <CargoBottomNav />
    </div>
  )
}
