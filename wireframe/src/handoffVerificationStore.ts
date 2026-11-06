import { defaultVerificationPolicy, validCoordinates, type HandoffVerification, type LabelLocationCheck } from './handoffVerificationDomain'
import type { SpokeOperation, SpokeTask } from './spokeDomain'

export const HANDOFF_SETTINGS_KEY = 'zaberman-handoff-settings:v1'
export type LabelScanScenario = 'matched' | 'wrong_order' | 'unknown'

interface LabelActivity {
  generation: LabelLocationCheck & { labelIds: string[]; generatedAt: string }
  scan: HandoffVerification
}
export interface LabelContext { order: string; operation: SpokeOperation; stopId?: string }

function labelActivityKey(kind: keyof LabelActivity, { order, operation, stopId }: LabelContext) {
  return `zaberman-label-activity:v1:${JSON.stringify([kind, order, operation, stopId])}`
}

export function readLabelActivity<K extends keyof LabelActivity>(kind: K, context: LabelContext): LabelActivity[K] | null {
  try { return JSON.parse(localStorage.getItem(labelActivityKey(kind, context)) ?? 'null') as LabelActivity[K] | null }
  catch { return null }
}

export function saveLabelActivity<K extends keyof LabelActivity>(kind: K, context: LabelContext, activity: LabelActivity[K]) {
  try { localStorage.setItem(labelActivityKey(kind, context), JSON.stringify(activity)); return true }
  catch { return false }
}
export function readLabelScanScenario(): LabelScanScenario {
  try {
    const value = JSON.parse(localStorage.getItem(HANDOFF_SETTINGS_KEY) ?? 'null')
    if (value?.qrScenario === 'wrong_order' || value?.qrScenario === 'unknown') return value.qrScenario
  } catch { /* Unavailable settings use the default label. */ }
  return 'matched'
}
export function writeLabelScanScenario(qrScenario: LabelScanScenario) {
  try { localStorage.setItem(HANDOFF_SETTINGS_KEY, JSON.stringify({ qrScenario })); return true } catch { return false }
}

export function capturePrototypeLabelLocation(task?: SpokeTask) {
  const coordinates = validCoordinates(task?.coordinates) ? task.coordinates : { latitude: 42, longitude: -71 }
  return {
    target: task?.address.trim() ? coordinates : undefined,
    fix: { ...coordinates, accuracy: 5, capturedAt: Date.now() },
    policy: defaultVerificationPolicy,
  }
}
