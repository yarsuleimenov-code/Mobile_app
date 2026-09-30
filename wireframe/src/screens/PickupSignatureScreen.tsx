import { CheckCircle2, FileSignature, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import {
  readDocumentEmailDeliveries, resolveDocumentEmailDelivery, upsertDocumentEmailDelivery, writeDocumentEmailDeliveries,
} from '../documentEmailStore'
import {
  canReviewOrderEvidence, withCurrentOrderDetails, canLockPickupEbol, createOrderEbol, isValidContactEmail, lockPickupEbol, lockSupplementalPickup,
  type OrderEbol, type PickupEbolConfirmationInput,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from '../orderEbolStore'
import { readPickupDrafts, removePickupDraft, writePickupDrafts } from '../pickupDraftStore'
import { pickupReviewNeedsRefresh } from '../pickupReviewState'
import { SignaturePad } from '../signature-components'
import { OrderEvidenceDetails } from '../OrderEvidenceDetails'
import { HandoffCommentsView } from '../orderReviewComments'
import { usePrototypeScenario } from '../prototypeScenarioStore'

interface PickupSignatureLocationState {
  confirmationInput: PickupEbolConfirmationInput
  supplementVersion?: number
}


export function PickupSignatureScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const reviewPath = `/orders/${orderNumber}/ebol/pickup`
  const { findRecord, getOrderDetails } = useCargo()
  const { network, emailOutcome } = usePrototypeScenario()
  const record = findRecord(orderNumber)
  const [orderEbol] = useState<OrderEbol | null>(() => withCurrentOrderDetails(
    findOrderEbol(readOrderEbols(), orderNumber) ?? (record ? createOrderEbol(record) : null),
    (location.state as PickupSignatureLocationState | null)?.supplementVersion ?? 'pickup', getOrderDetails(orderNumber),
  ))
  const confirmationInput = (location.state as PickupSignatureLocationState | null)?.confirmationInput
  const supplementVersion = (location.state as PickupSignatureLocationState | null)?.supplementVersion
  const supplement = supplementVersion === undefined
    ? undefined
    : orderEbol?.pickupSupplements?.find((item) => item.version === supplementVersion)
  const startsWithContact = confirmationInput?.contactMethod === 'signed'
  const [step, setStep] = useState<'contact' | 'driver'>(startsWithContact ? 'contact' : 'driver')
  const [contactSigned, setContactSigned] = useState(!startsWithContact)
  const [driverSigned, setDriverSigned] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [sendEmailCopy, setSendEmailCopy] = useState(false)
  const [contactEmail, setContactEmail] = useState(orderEbol?.pickup.contact.emailCopyRequest?.recipientEmail ?? '')

  if (pickupReviewNeedsRefresh(orderEbol, readPickupDrafts()) || !canReviewOrderEvidence(supplement?.evidence ?? orderEbol?.pickup.evidence) || !orderEbol?.pickup.evidence || !confirmationInput || !canLockPickupEbol(confirmationInput) || (supplementVersion !== undefined && !supplement?.evidence)) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL signing" subtitle={`Pickup · Order #${orderNumber || 'unknown'}`} />
        <main className="signature-empty"><FileSignature size={44} /><h2>Review required</h2><p>Review Pickup evidence and signer details before opening the signing screen.</p><button type="button" className="cargo-primary" onClick={() => navigate(reviewPath, { replace: true })}>Return to Pickup review</button></main>
        <CargoBottomNav />
      </div>
    )
  }

  if ((supplementVersion === undefined && orderEbol.pickup.lockedAt) || supplement?.lockedAt) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL signing" subtitle={`Pickup · Order #${orderNumber}`} />
        <main className="signature-empty"><CheckCircle2 size={48} /><h2>{supplement ? `Version ${supplement.version} already signed` : 'Pickup already signed'}</h2><p>The selected Pickup snapshot is locked.</p><button type="button" className="cargo-primary" onClick={() => navigate(reviewPath, { replace: true })}>Open Order eBOL</button></main>
        <CargoBottomNav />
      </div>
    )
  }

  const finishContact = () => {
    if (sendEmailCopy && !isValidContactEmail(contactEmail)) return
    setContactSigned(true)
    setStep('driver')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishPickupSigning = () => {
    const input = { ...confirmationInput, sendEmailCopy: startsWithContact && sendEmailCopy, contactEmail: contactEmail.trim() }
    const locked = supplementVersion === undefined
      ? lockPickupEbol(orderEbol, input)
      : lockSupplementalPickup(orderEbol, supplementVersion, input)
    const saved = writeOrderEbols(upsertOrderEbol(readOrderEbols(), locked))
    if (!saved) {
      setStorageError(true)
      return
    }
    const signedSupplement = supplementVersion === undefined
      ? undefined
      : locked.pickupSupplements.find((item) => item.version === supplementVersion)
    const signedVersion = supplementVersion === undefined ? locked.pickup : signedSupplement
    const request = signedVersion?.contact.emailCopyRequest
    if (request) {
      const documentNumber = signedSupplement?.documentNumber ?? `${orderNumber}-PU-1`
      const deliveries = readDocumentEmailDeliveries()
      const delivery = resolveDocumentEmailDelivery(
        documentNumber, request.recipientEmail, request.requestedAt, network, emailOutcome,
      )
      writeDocumentEmailDeliveries(upsertDocumentEmailDelivery(deliveries, delivery))
    }
    writePickupDrafts(removePickupDraft(
      readPickupDrafts(),
      orderNumber,
      supplementVersion === undefined ? 'standard' : 'supplemental',
    ))
    navigate(reviewPath, { replace: true })
  }

  const stepNumber = startsWithContact ? (step === 'contact' ? 1 : 2) : 1
  const stepTotal = startsWithContact ? 2 : 1

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Order eBOL signing" subtitle={supplement ? `Supplemental Pickup · Version ${supplement.version}` : `Pickup · Order #${orderNumber}`} onBack={() => navigate(reviewPath, { replace: true })} />
      <main className="signature-body">
        <div className="signature-progress"><span>Step {stepNumber} of {stepTotal}</span><div><i style={{ width: `${(stepNumber / stepTotal) * 100}%` }} /></div></div>
        <div className="signature-disclaimer"><ShieldCheck size={22} /><p>{supplement ? `Signatures apply only to ${supplement.addedPlaceIds.length} places in version ${supplement.version}. Version 1 remains unchanged. ` : ''}Confirm the recorded cargo details and any exceptions before signing.</p></div>

        <OrderEvidenceDetails evidence={supplement?.evidence ?? orderEbol.pickup.evidence} />
        <HandoffCommentsView comments={{ contact: confirmationInput.contactComment, driver: confirmationInput.driverComment }} />
        {confirmationInput.hasDamage ? <div className="ebol-exception" role="note"><strong>Exception documented</strong><p>{confirmationInput.exceptionNote}</p></div> : null}
        {step === 'contact' ? (
          <section className="signature-card">
            <div className="signature-role"><UserRound size={25} /><span><strong>Pickup contact</strong><small>{confirmationInput.contactName}</small></span></div>
            <p>By signing, the Pickup contact confirms review of the recorded evidence and exceptions.</p>
            <div className="pickup-email-copy">
              <label className="pickup-email-choice"><input type="checkbox" checked={sendEmailCopy} onChange={(event) => setSendEmailCopy(event.target.checked)} /><span><strong>Email me a copy of the signed Pickup document</strong><small>Optional. This address is used for this document version.</small></span></label>
              {sendEmailCopy ? <label className="ebol-field">Email address<input type="email" autoComplete="email" spellCheck={false} maxLength={254} value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="name@example.com" aria-invalid={Boolean(contactEmail) && !isValidContactEmail(contactEmail)} /></label> : null}
              {sendEmailCopy && !isValidContactEmail(contactEmail) ? <p className="pickup-email-error" role="alert">Enter an email address in the correct format, like name@example.com.</p> : null}
            </div>
            <SignaturePad label="Pickup contact" onSignedChange={setContactSigned} />
            <button type="button" className="cargo-primary" disabled={!contactSigned || (sendEmailCopy && !isValidContactEmail(contactEmail))} onClick={finishContact}>Accept contact signature</button>
          </section>
        ) : (
          <section className="signature-card">
            {confirmationInput.contactMethod === 'otp' ? (
              <div className="otp-signing-summary"><ShieldCheck size={22} /><span><strong>Pickup contact verified by OTP</strong><small>{confirmationInput.contactName} · ••• ••• {confirmationInput.otpPhoneLast4}</small></span></div>
            ) : (
              <div className="signature-prior-confirmation"><CheckCircle2 size={20} /><span>{confirmationInput.contactName} signed</span></div>
            )}
            {startsWithContact ? <div className="pickup-email-summary"><Mail size={20} /><span><strong>{sendEmailCopy ? 'Email copy requested' : 'No email copy requested'}</strong>{sendEmailCopy ? <small>{contactEmail.trim()}</small> : null}</span><button type="button" onClick={() => { setContactSigned(false); setDriverSigned(false); setStep('contact') }}>Change</button></div> : null}
            <div className="signature-role"><UserRound size={25} /><span><strong>Zaberman driver</strong><small>{confirmationInput.driverName}</small></span></div>
            <p>{confirmationInput.contactMethod === 'otp' ? 'The Pickup contact is already verified. By signing, the driver confirms the Pickup evidence and documented exceptions.' : 'By signing, the driver confirms the same Pickup evidence and documented exceptions.'}</p>
            <SignaturePad key="driver" label="Zaberman driver" onSignedChange={setDriverSigned} />
            {storageError ? <p className="ebol-storage-warning">Browser storage is unavailable. The Pickup snapshot was not locked.</p> : null}
            <button type="button" className="cargo-primary" disabled={!driverSigned} onClick={finishPickupSigning}>Confirm & lock {supplement ? `version ${supplement.version}` : 'Pickup snapshot'}</button>
          </section>
        )}
      </main>
      <CargoBottomNav />
    </div>
  )
}
