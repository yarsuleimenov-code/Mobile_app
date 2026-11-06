import { readEvidenceQueue, trackWorkflowChange, writeEvidenceQueue, type EvidenceSyncItem, type WorkflowChange } from './photoEvidenceDomain'

export const syncQueueEvent = 'zaberman-sync-queue'

export function updateSavedSyncQueue(change: (queue: EvidenceSyncItem[]) => EvidenceSyncItem[]) {
  const current = readEvidenceQueue()
  const next = change(current)
  if (next !== current) {
    if (!writeEvidenceQueue(next)) throw new Error('Could not save the sync queue. Check device storage and try again.')
    window.dispatchEvent(new Event(syncQueueEvent))
  }
  return next
}

export function saveWorkflowChange(key: string, value: unknown, change: WorkflowChange) {
  const previous = localStorage.getItem(key)
  localStorage.setItem(key, JSON.stringify(value))
  try {
    updateSavedSyncQueue((queue) => trackWorkflowChange(queue, change))
  } catch (error) {
    if (previous === null) localStorage.removeItem(key)
    else localStorage.setItem(key, previous)
    throw error
  }
}
