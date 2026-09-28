export type OtpOutcome = 'success' | 'invalid' | 'expired' | 'delivery_error'
export type OtpVerificationStatus = 'idle' | 'sent' | 'invalid' | 'expired' | 'delivery_error' | 'verified' | 'locked'

export interface OtpVerificationState {
  status: OtpVerificationStatus
  attempts: number
  sends: number
}

export interface OtpRecipient {
  name: string
  phone: string
}

export const OTP_DEMO_CODE = '846219'
export const OTP_MAX_ATTEMPTS = 3
export const OTP_MAX_SENDS = 3

const requiredOtpOrders: Record<string, OtpRecipient> = {
  '11155599': { name: 'Michael Reed', phone: '+1 781 555 0198' },
  '99007008': { name: 'Michael Reed', phone: '+1 781 555 0198' },
}

export const initialOtpState: OtpVerificationState = { status: 'idle', attempts: 0, sends: 0 }

export function otpRecipient(orderNumber: string) {
  return requiredOtpOrders[orderNumber]
}

export function isOtpRequiredOrder(orderNumber: string) {
  return Boolean(otpRecipient(orderNumber))
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `••• ••• ${digits.slice(-4)}`
}

export function sendOtp(state: OtpVerificationState, outcome: OtpOutcome, offline = false): OtpVerificationState {
  if (state.status === 'locked' || state.sends >= OTP_MAX_SENDS) return { ...state, status: 'locked' }
  const sends = state.sends + 1
  if (offline || outcome === 'delivery_error') return { ...state, sends, status: 'delivery_error' }
  return { status: 'sent', attempts: state.attempts, sends }
}

export function verifyOtp(state: OtpVerificationState, code: string, outcome: OtpOutcome): OtpVerificationState {
  if (state.status === 'locked' || state.status === 'verified') return state
  if (outcome === 'expired') return { ...state, status: 'expired' }
  if (outcome === 'success' && code === OTP_DEMO_CODE) return { ...state, status: 'verified' }
  const attempts = state.attempts + 1
  return { ...state, attempts, status: attempts >= OTP_MAX_ATTEMPTS ? 'locked' : 'invalid' }
}

export function otpAttemptsRemaining(state: OtpVerificationState) {
  return Math.max(0, OTP_MAX_ATTEMPTS - state.attempts)
}
