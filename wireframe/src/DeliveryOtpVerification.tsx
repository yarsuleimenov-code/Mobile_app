import { AlertTriangle, Check, Clock3, LockKeyhole, MessageSquareText, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import {
  initialOtpState,
  maskPhone,
  OTP_MAX_SENDS,
  otpAttemptsRemaining,
  sendOtp,
  verifyOtp,
  type OtpOutcome,
} from './deliveryOtpDomain'

interface DeliveryOtpVerificationProps {
  recipientName: string
  recipientPhone: string
  outcome: OtpOutcome
  offline: boolean
  onVerifiedChange: (verified: boolean) => void
}

export function DeliveryOtpVerification({ recipientName, recipientPhone, outcome, offline, onVerifiedChange }: DeliveryOtpVerificationProps) {
  const [state, setState] = useState(initialOtpState)
  const [code, setCode] = useState('')
  const remaining = otpAttemptsRemaining(state)
  const canSendAgain = state.sends < OTP_MAX_SENDS && state.status !== 'locked'

  const requestCode = () => {
    const next = sendOtp(state, outcome, offline)
    setState(next)
    setCode('')
    onVerifiedChange(false)
  }
  const submitCode = () => {
    const next = verifyOtp(state, code, outcome)
    setState(next)
    onVerifiedChange(next.status === 'verified')
  }

  return (
    <div className="delivery-otp">
      <div className="delivery-otp-recipient"><MessageSquareText size={22} /><span><strong>{recipientName}</strong><small>Code will be sent to {maskPhone(recipientPhone)}</small></span><b>SMS</b></div>

      {state.status === 'idle' ? <><p>Ask the recipient for the one-time code before handing over the order.</p><button type="button" className="delivery-otp-send" onClick={requestCode}><MessageSquareText size={18} /> Send verification code</button></> : null}

      {['sent', 'invalid'].includes(state.status) ? <div className="delivery-otp-entry">
        <div className="delivery-otp-sent"><Check size={17} /><span><strong>Code sent</strong><small>Expires in 10 minutes · {state.sends}/{OTP_MAX_SENDS} sends</small></span></div>
        <label>6-digit code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" aria-invalid={state.status === 'invalid'} /></label>
        {state.status === 'invalid' ? <p className="delivery-otp-error" role="alert"><AlertTriangle size={17} /> Code not recognized. {remaining} attempt{remaining === 1 ? '' : 's'} remaining.</p> : null}
        <button type="button" className="delivery-otp-verify" disabled={code.length !== 6} onClick={submitCode}><ShieldCheck size={18} /> Verify recipient</button>
        <button type="button" className="delivery-otp-resend" disabled={!canSendAgain} onClick={requestCode}><RefreshCw size={15} /> Send a new code</button>
      </div> : null}

      {state.status === 'expired' ? <div className="delivery-otp-problem"><Clock3 size={23} /><span><strong>Code expired</strong><small>Send a new code to the same registered number.</small></span>{canSendAgain ? <button type="button" onClick={requestCode}>Send new code</button> : null}</div> : null}
      {state.status === 'delivery_error' ? <div className="delivery-otp-problem"><AlertTriangle size={23} /><span><strong>SMS could not be delivered</strong><small>Confirm connectivity or contact the dispatcher. The recipient number cannot be changed here.</small></span>{canSendAgain ? <button type="button" onClick={requestCode}>Retry SMS</button> : null}</div> : null}
      {state.status === 'locked' ? <div className="delivery-otp-problem is-locked"><LockKeyhole size={23} /><span><strong>Verification locked</strong><small>Too many failed attempts. Contact the dispatcher to approve another confirmation method.</small></span></div> : null}
      {state.status === 'verified' ? <div className="delivery-otp-verified"><ShieldCheck size={23} /><span><strong>Recipient verified</strong><small>OTP confirmation will be recorded in the completed POD.</small></span></div> : null}
    </div>
  )
}
