import { defaultVerificationPolicy, type Coordinates, type LocationFix, type VerificationPolicy } from './handoffVerificationDomain'
import type { SpokeTask } from './spokeDomain'

export const HANDOFF_SETTINGS_KEY = 'zaberman-handoff-settings:v1'
export const locationScenarios = {
  device: 'Device location', near: 'At the stop', outside: 'Outside the zone', inaccurate: 'Low GPS accuracy',
  denied: 'Permission denied', unavailable: 'Location unavailable', no_coordinates: 'Stop without coordinates',
} as const
export type LocationScenario = keyof typeof locationScenarios
export interface HandoffSettings extends VerificationPolicy { scenario: LocationScenario; qrScenario: 'matched' | 'wrong_order' | 'unknown' }
export function readHandoffSettings(): HandoffSettings {
  try {
    const value = JSON.parse(localStorage.getItem(HANDOFF_SETTINGS_KEY) ?? 'null')
    if (value && Object.hasOwn(locationScenarios, value.scenario)
      && Number.isFinite(value.radius) && value.radius >= 1 && value.radius <= 10000
      && Number.isFinite(value.maxAccuracy) && value.maxAccuracy >= 1 && value.maxAccuracy <= 10000) {
      return { radius: value.radius, maxAccuracy: value.maxAccuracy, maxAgeMs: defaultVerificationPolicy.maxAgeMs, scenario: value.scenario,
        qrScenario: ['matched', 'wrong_order', 'unknown'].includes(value.qrScenario) ? value.qrScenario : 'matched' }
    }
  } catch { /* Unavailable/invalid settings use explicit defaults. */ }
  return { ...defaultVerificationPolicy, scenario: 'device', qrScenario: 'matched' }
}
export function writeHandoffSettings(settings: HandoffSettings) {
  try { localStorage.setItem(HANDOFF_SETTINGS_KEY, JSON.stringify(settings)); return true } catch { return false }
}

export async function captureHandoffLocation(task: SpokeTask | undefined, settings: HandoffSettings): Promise<{
  target?: Coordinates; fix?: LocationFix; error?: 'denied' | 'unavailable'
}> {
  const target = settings.scenario === 'device' ? task?.coordinates
    : settings.scenario === 'no_coordinates' || !task?.address.trim() ? undefined : { latitude: 42, longitude: -71 }
  if (settings.scenario !== 'device') {
    // Synthetic coordinates exist only in the explicit Administration scenarios, never as address geocoding.
    if (settings.scenario === 'denied' || settings.scenario === 'unavailable') return { target, error: settings.scenario }
    return { target, fix: { latitude: 42 + (settings.scenario === 'outside' ? settings.radius * 3 / 111_000 : 0),
      longitude: -71, accuracy: settings.scenario === 'inaccurate' ? settings.maxAccuracy + 100 : 5, capturedAt: Date.now() } }
  }
  if (!navigator.geolocation) return { target, error: 'unavailable' }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition((position) => resolve({ target, fix: {
      latitude: position.coords.latitude, longitude: position.coords.longitude,
      accuracy: position.coords.accuracy, capturedAt: position.timestamp,
    } }), (error) => resolve({ target, error: error.code === 1 ? 'denied' : 'unavailable' }),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
  })
}
