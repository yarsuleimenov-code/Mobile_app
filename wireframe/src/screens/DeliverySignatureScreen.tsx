import { CheckCircle2, FileSignature, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import {
  canReviewOrderEvidence, withCurrentOrderDetails, canLockDeliveryEbol, lockDeliveryEbol,
  type DeliveryEbolConfirmationInput, type OrderEbol,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from '../orderEbolStore'
import { SignaturePad } from '../signature-components'
import { OrderEvidenceDetails } from '../OrderEvidenceDetails'
import { useCargo } from '../cargoStore'
import { ContactCommentView, HandoffCommentEditor, HandoffCommentSaveError, useHandoffComments } from '../orderReviewComments'

interface DeliverySignatureLocationState {
  confirmationInput: DeliveryEbolConfirmationInput
}

export function DeliverySignatureScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const reviewPath = `/orders/${orderNumber}/ebol/delivery`
  const { getOrderDetails } = useCargo()
  const [orderEbol] = useState<OrderEbol | null>(() => withCurrentOrderDetails(findOrderEbol(readOrderEbols(), orderNumber) ?? null, 'delivery', getOrderDetails(orderNumber)))
  const confirmationInput = (location.state as DeliverySignatureLocationState | null)?.confirmationInput
  const startsWithContact = confirmationInput?.contactMethod === 'signed'
  const [step, setStep] = useState<'contact' | 'driver'>(startsWithContact ? 'contact' : 'driver')
  const [contactSigned, setContactSigned] = useState(!startsWithContact)
  const [driverSigned, setDriverSigned] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const { comments, changeComments, saveError } = useHandoffComments(orderEbol, 'delivery')

  if (!canReviewOrderEvidence(orderEbol?.delivery.evidence) || !orderEbol?.pickup.lockedAt || !orderEbol.delivery.evidence || !confirmationInput || !canLockDeliveryEbol(confirmationInput) || (confirmationInput.contactMethod === 'otp' && comments.contact !== (confirmationInput.contactComment ?? ''))) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL signing" subtitle={`Delivery · Order #${orderNumber || 'unknown'}`} />
        <main className="signature-empty"><FileSignature size={44} /><h2>Review required</h2><p>Review Delivery evidence and signer details before opening the signing screen.</p><button type="button" className="cargo-primary" onClick={() => navigate(reviewPath, { replace: true })}>Return to Delivery review</button></main>
        <CargoBottomNav />
      </div>
    )
  }

  if (orderEbol.delivery.lockedAt) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL signing" subtitle={`Delivery · Order #${orderNumber}`} />
        <main className="signature-empty"><CheckCircle2 size={48} /><h2>Delivery already signed</h2><p>The completed Order eBOL is locked.</p><button type="button" className="cargo-primary" onClick={() => navigate(reviewPath, { replace: true })}>Open Order eBOL</button></main>
        <CargoBottomNav />
      </div>
    )
  }

  const finishContact = () => {
    if (!contactSigned || !changeComments(comments)) return
    setContactSigned(true)
    setStep('driver')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishDeliverySigning = () => {
    if (!driverSigned || (startsWithContact && !contactSigned) || !changeComments(comments)) return
    const current = withCurrentOrderDetails(findOrderEbol(readOrderEbols(), orderNumber) ?? orderEbol, 'delivery', getOrderDetails(orderNumber))!
    if (current.delivery.lockedAt) { navigate(reviewPath, { replace: true }); return }
    const locked = lockDeliveryEbol(current, { ...confirmationInput, contactComment: comments.contact, driverComment: comments.driver })
    const saved = writeOrderEbols(upsertOrderEbol(readOrderEbols(), locked))
    if (!saved) {
      setStorageError(true)
      return
    }
    navigate(reviewPath, { replace: true })
  }

  const stepNumber = startsWithContact ? (step === 'contact' ? 1 : 2) : 1
  const stepTotal = startsWithContact ? 2 : 1

  return (
    <div className="cargo-flow">
      <CargoFlowHeader title="Order eBOL signing" subtitle={`Delivery · Order #${orderNumber}`} onBack={() => navigate(reviewPath, { replace: true })} />
      <main className="signature-body">
        <div className="signature-progress"><span>Step {stepNumber} of {stepTotal}</span><div><i style={{ width: `${(stepNumber / stepTotal) * 100}%` }} /></div></div>
        <div className="signature-disclaimer"><ShieldCheck size={22} /><p>Confirm the recorded delivery details and any exceptions before signing.</p></div>

        <OrderEvidenceDetails evidence={orderEbol.delivery.evidence} />
        <HandoffCommentSaveError visible={saveError} />
        {confirmationInput.hasDamage ? <div className="ebol-exception" role="note"><strong>Exception documented</strong><p>{confirmationInput.exceptionNote}</p></div> : null}
        {step === 'contact' ? (
          <section className="signature-card">
            <div className="signature-role"><UserRound size={25} /><span><strong>Delivery contact</strong><small>{confirmationInput.contactName}</small></span></div>
            <p>By signing, the Delivery contact confirms review of the recorded evidence and exceptions.</p>
            <HandoffCommentEditor party="contact" value={comments.contact} onChange={(value) => { setContactSigned(false); changeComments({ ...comments, contact: value }) }} />
            <SignaturePad key={`contact:${comments.contact}`} label="Delivery contact" onSignedChange={setContactSigned} />
            <button type="button" className="cargo-primary" disabled={!contactSigned} onClick={finishContact}>Accept contact signature</button>
          </section>
        ) : (
          <section className="signature-card">
            {confirmationInput.contactMethod === 'otp' ? (
              <div className="otp-signing-summary"><ShieldCheck size={22} /><span><strong>Recipient verified by OTP</strong><small>{confirmationInput.contactName} · ••• ••• {confirmationInput.otpPhoneLast4}</small></span></div>
            ) : (
              <div className="signature-prior-confirmation"><CheckCircle2 size={20} /><span>{confirmationInput.contactName} signed</span></div>
            )}
            <ContactCommentView value={comments.contact} />
            {startsWithContact ? <button type="button" className="ebol-secondary" onClick={() => { setContactSigned(false); setDriverSigned(false); setStep('contact') }}>Edit contact comment · sign again</button> : null}
            <div className="signature-role"><UserRound size={25} /><span><strong>Zaberman driver</strong><small>{confirmationInput.driverName}</small></span></div>
            <p>{confirmationInput.contactMethod === 'otp' ? 'The recipient is already verified. By signing, the driver confirms the Delivery evidence and documented exceptions.' : 'By signing, the driver confirms the same Delivery evidence and documented exceptions.'}</p>
            <HandoffCommentEditor party="driver" value={comments.driver} onChange={(value) => { setDriverSigned(false); changeComments({ ...comments, driver: value }) }} />
            <SignaturePad key={`driver:${comments.driver}`} label="Zaberman driver" onSignedChange={setDriverSigned} />
            {storageError ? <p className="ebol-storage-warning">Browser storage is unavailable. The Delivery snapshot was not locked.</p> : null}
            <button type="button" className="cargo-primary" disabled={!driverSigned} onClick={finishDeliverySigning}>Complete Order eBOL</button>
          </section>
        )}
      </main>
      <CargoBottomNav />
    </div>
  )
}
