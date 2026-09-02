import type { LabelPrintAttempt, LabelPrintState } from './placeLabelsDomain'

interface LabelStorage { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void }
const key = (orderNumber: string) => `zaberman-label-print:v1:${orderNumber}`
const stringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string')

export function readLabelPrintState(orderNumber: string, storage: LabelStorage = localStorage): LabelPrintState {
  const empty: LabelPrintState = { scope: 'all', selectedIds: [], history: [] }
  try {
    const parsed = JSON.parse(storage.getItem(key(orderNumber)) ?? 'null') as Partial<LabelPrintState> | null
    if (!parsed) return empty
    const history = Array.isArray(parsed.history) ? parsed.history.filter((item): item is LabelPrintAttempt => Boolean(item)
      && typeof item.id === 'string' && typeof item.at === 'string' && Number.isFinite(Date.parse(item.at))
      && stringArray(item.labelIds) && stringArray(item.reprintedIds) && stringArray(item.versions)
      && ['success', 'error', 'unavailable'].includes(item.outcome)).slice(0, 20) : []
    return { scope: typeof parsed.scope === 'string' ? parsed.scope : 'all', selectedIds: stringArray(parsed.selectedIds) ? [...new Set(parsed.selectedIds)] : [], history }
  } catch { return empty }
}

export function writeLabelPrintState(orderNumber: string, state: LabelPrintState, storage: LabelStorage = localStorage) {
  try { storage.setItem(key(orderNumber), JSON.stringify(state)); return true } catch { return false }
}
