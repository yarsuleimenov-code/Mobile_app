import { describe, expect, it } from 'vitest'
import {
  initialOtpState,
  maskPhone,
  OTP_DEMO_CODE,
  otpAttemptsRemaining,
  otpRecipient,
  sendOtp,
  verifyOtp,
} from './deliveryOtpDomain'

describe('Delivery OTP', () => {
  it('masks the recipient phone and identifies required orders', () => {
    expect(maskPhone('+1 781 555 0198')).toBe('••• ••• 0198')
    expect(otpRecipient('99007008')?.name).toBe('Michael Reed')
  })

  it('verifies only the expected six-digit code in the success scenario', () => {
    const sent = sendOtp(initialOtpState, 'success')
    expect(verifyOtp(sent, OTP_DEMO_CODE, 'success').status).toBe('verified')
    expect(verifyOtp(sent, '000000', 'success').status).toBe('invalid')
  })

  it('locks after three invalid attempts', () => {
    let state = sendOtp(initialOtpState, 'invalid')
    state = verifyOtp(state, '000000', 'invalid')
    state = verifyOtp(state, '000000', 'invalid')
    state = verifyOtp(state, '000000', 'invalid')
    expect(state.status).toBe('locked')
    expect(otpAttemptsRemaining(state)).toBe(0)
  })

  it('exposes expired, delivery error and offline states', () => {
    const sent = sendOtp(initialOtpState, 'expired')
    expect(verifyOtp(sent, OTP_DEMO_CODE, 'expired').status).toBe('expired')
    expect(sendOtp(initialOtpState, 'delivery_error').status).toBe('delivery_error')
    expect(sendOtp(initialOtpState, 'success', true).status).toBe('delivery_error')
  })
})
