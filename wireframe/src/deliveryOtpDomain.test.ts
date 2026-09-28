import { describe, expect, it } from 'vitest'
import {
  initialOtpState,
  maskPhone,
  OTP_INVALID_CODE,
  otpAttemptsRemaining,
  otpRecipient,
  sendOtp,
  verifyOtp,
} from './deliveryOtpDomain'

describe('Delivery OTP', () => {
  it('masks the phone and provides a recipient for every Dropoff', () => {
    expect(maskPhone('+1 781 555 0198')).toBe('••• ••• 0198')
    expect(otpRecipient('99007008')?.name).toBe('Michael Reed')
    expect(otpRecipient('any-dropoff')).toEqual({ name: 'Delivery recipient', phone: '+1 781 555 0198' })
  })

  it('accepts any six-digit code except the reserved invalid code', () => {
    const sent = sendOtp(initialOtpState, 'success')
    expect(verifyOtp(sent, '846219', 'success').status).toBe('verified')
    expect(verifyOtp(sent, '000000', 'success').status).toBe('verified')
    expect(verifyOtp(sent, OTP_INVALID_CODE, 'success').status).toBe('invalid')
  })

  it('locks after three invalid attempts', () => {
    let state = sendOtp(initialOtpState, 'success')
    state = verifyOtp(state, OTP_INVALID_CODE, 'success')
    state = verifyOtp(state, OTP_INVALID_CODE, 'success')
    state = verifyOtp(state, OTP_INVALID_CODE, 'success')
    expect(state.status).toBe('locked')
    expect(otpAttemptsRemaining(state)).toBe(0)
  })

  it('exposes expired, delivery error and offline states', () => {
    const sent = sendOtp(initialOtpState, 'expired')
    expect(verifyOtp(sent, '846219', 'expired').status).toBe('expired')
    expect(sendOtp(initialOtpState, 'delivery_error').status).toBe('delivery_error')
    expect(sendOtp(initialOtpState, 'success', true).status).toBe('delivery_error')
  })
})
