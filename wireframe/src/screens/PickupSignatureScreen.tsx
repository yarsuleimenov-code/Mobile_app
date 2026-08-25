import { CheckCircle2, FileSignature, FileX2, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CargoBottomNav, CargoFlowHeader } from '../cargo-components'
import { normalizeOrderNumber } from '../cargoDomain'
import { useCargo } from '../cargoStore'
import {
  canLockPickupEbol, createOrderEbol, lockPickupEbol,
  type OrderEbol, type PickupEbolConfirmationInput,
} from '../orderEbolDomain'
import { findOrderEbol, readOrderEbols, upsertOrderEbol, writeOrderEbols } from '../orderEbolStore'
import { SignaturePad } from '../signature-components'

interface PickupSignatureLocationState {
  confirmationInput: PickupEbolConfirmationInput
}


export function PickupSignatureScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orderNumber: orderParam = '' } = useParams()
  const orderNumber = normalizeOrderNumber(orderParam)
  const reviewPath = `/orders/${orderNumber}/ebol/pickup`
  const { findRecord } = useCargo()
  const record = findRecord(orderNumber)
  const [orderEbol] = useState<OrderEbol | null>(() => (
    findOrderEbol(readOrderEbols(), orderNumber) ?? (record ? createOrderEbol(record) : null)
  ))
  const confirmationInput = (location.state as PickupSignatureLocationState | null)?.confirmationInput
  const startsWithContact = confirmationInput?.contactMethod === 'signed'
  const [step, setStep] = useState<'contact' | 'driver'>(startsWithContact ? 'contact' : 'driver')
  const [contactSigned, setContactSigned] = useState(!startsWithContact)
  const [driverSigned, setDriverSigned] = useState(false)
  const [storageError, setStorageError] = useState(false)

  if (!orderEbol?.pickup.evidence || !confirmationInput || !canLockPickupEbol(confirmationInput)) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL signing" subtitle={`Pickup · Order #${orderNumber || 'unknown'}`} />
        <main className="signature-empty"><FileSignature size={44} /><h2>Review required</h2><p>Review Pickup evidence and signer details before opening the signing screen.</p><button type="button" className="cargo-primary" onClick={() => navigate(reviewPath, { replace: true })}>Return to Pickup review</button></main>
        <CargoBottomNav />
      </div>
    )
  }

  if (orderEbol.pickup.lockedAt) {
    return (
      <div className="cargo-flow">
        <CargoFlowHeader title="Order eBOL signing" subtitle={`Pickup · Order #${orderNumber}`} />
        <main className="signature-empty"><CheckCircle2 size={48} /><h2>Pickup already signed</h2><p>The Pickup snapshot is locked.</p><button type="button" className="cargo-primary" onClick={() => navigate(reviewPath, { replace: true })}>Open Order eBOL</button></main>
        <CargoBottomNav />
      </div>
    )
  }

  const finishContact = () => {
    setContactSigned(true)
    setStep('driver')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishPickupSigning = () => {
    const locked = lockPickupEbol(orderEbol, confirmationInput)
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
      <CargoFlowHeader title="Order eBOL signing" subtitle={`Pickup · Order #${orderNumber}`} onBack={() => navigate(reviewPath, { replace: true })} />
      <main className="signature-body">
        <div className="signature-progress"><span>Step {stepNumber} of {stepTotal}</span><div><i style={{ width: `${(stepNumber / stepTotal) * 100}%` }} /></div></div>
        <div className="signature-disclaimer"><ShieldCheck size={22} /><p>This is a visual prototype. The drawing is not a legally binding electronic signature and is not stored as an image.</p></div>

        {step === 'contact' ? (
          <section className="signature-card">
            <div className="signature-role"><UserRound size={25} /><span><strong>Pickup contact</strong><small>{confirmationInput.contactName}</small></span></div>
            <p>By signing, the Pickup contact confirms review of the recorded evidence and exceptions.</p>
            <SignaturePad label="Pickup contact" onSignedChange={setContactSigned} />
            <button type="button" className="cargo-primary" disabled={!contactSigned} onClick={finishContact}>Accept contact signature</button>
          </section>
        ) : (
          <section className="signature-card">
            {confirmationInput.contactMethod === 'contactless' ? (
              <div className="contactless-signing-summary"><FileX2 size={22} /><span><strong>Contact signature skipped</strong><small>{confirmationInput.contactlessReason}</small></span></div>
            ) : (
              <div className="signature-prior-confirmation"><CheckCircle2 size={20} /><span>{confirmationInput.contactName} signed</span></div>
            )}
            <div className="signature-role"><UserRound size={25} /><span><strong>Zaberman driver</strong><small>{confirmationInput.driverName}</small></span></div>
            <p>{confirmationInput.contactMethod === 'contactless' ? 'The driver is the only signer and confirms the selected contactless reason, Pickup evidence and exceptions.' : 'By signing, the driver confirms the same Pickup evidence and documented exceptions.'}</p>
            <SignaturePad key="driver" label="Zaberman driver" onSignedChange={setDriverSigned} />
            {storageError ? <p className="ebol-storage-warning">Browser storage is unavailable. The Pickup snapshot was not locked.</p> : null}
            <button type="button" className="cargo-primary" disabled={!driverSigned} onClick={finishPickupSigning}>Confirm & lock Pickup snapshot</button>
          </section>
        )}
      </main>
      <CargoBottomNav />
    </div>
  )
}
