import { useCallback, useEffect, useRef, useState } from 'react'
import { beginEvidenceSync, EVIDENCE_QUEUE_KEY, finishEvidenceSync, readEvidenceQueue, resolveEvidenceConflict, trackEvidence, type EvidenceOperation, type EvidenceSyncItem } from './photoEvidenceDomain'
import type { SyncOutcome } from './prototypeScenarioStore'
import { syncQueueEvent, updateSavedSyncQueue } from './syncQueueStore'

export function useEvidenceSync(network: string, outcome: SyncOutcome) {
  const [savedQueue, setQueue] = useState(readEvidenceQueue)
  const [activeBatch, setActiveBatch] = useState<EvidenceSyncItem[]>([])
  const [evidenceStorageError, setStorageError] = useState(false)
  const networkRef = useRef(network)
  networkRef.current = network
  const busy = useRef(false)
  const updateQueue = useCallback((change: (queue: EvidenceSyncItem[]) => EvidenceSyncItem[]) => {
    try {
      setQueue(updateSavedSyncQueue(change))
      setStorageError(false)
    } catch { setStorageError(true) }
  }, [])
  useEffect(() => {
    const refresh = () => setQueue(readEvidenceQueue())
    const onStorage = (event: StorageEvent) => { if (!event.key || event.key === EVIDENCE_QUEUE_KEY) refresh() }
    window.addEventListener(syncQueueEvent, refresh)
    window.addEventListener('storage', onStorage)
    refresh()
    return () => {
      window.removeEventListener(syncQueueEvent, refresh)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
  const trackEvidenceOperation = useCallback((operation: EvidenceOperation) => {
    updateQueue((queue) => trackEvidence(queue, operation))
  }, [updateQueue])
  const keepLocalEvidence = useCallback((operationId: string) => {
    updateQueue((queue) => resolveEvidenceConflict(queue, operationId))
  }, [updateQueue])
  const syncEvidence = useCallback(async (operationId?: string) => {
    if (busy.current || networkRef.current === 'offline' || !navigator.onLine) return
    busy.current = true
    const send = async () => {
      const batch = beginEvidenceSync(readEvidenceQueue(), operationId)
      if (!batch.length) return
      setActiveBatch(batch)
      await new Promise((resolve) => window.setTimeout(resolve, networkRef.current === 'slow' ? 1800 : 700))
      if (networkRef.current === 'offline' || !navigator.onLine) return
      updateQueue((queue) => finishEvidenceSync(queue, batch, outcome))
    }
    try {
      if (navigator.locks) await navigator.locks.request(EVIDENCE_QUEUE_KEY, { ifAvailable: true }, async (lock) => { if (lock) await send() })
      else await send()
    } finally {
      setActiveBatch([])
      busy.current = false
    }
  }, [outcome, updateQueue])
  const syncing = new Map(activeBatch.map((item) => [item.id, item.revision]))
  const evidenceQueue = activeBatch.length ? savedQueue.map((item): EvidenceSyncItem => (
    syncing.get(item.id) === item.revision ? { ...item, status: 'syncing' } : item
  )) : savedQueue
  return { evidenceQueue, evidenceStorageError, trackEvidenceOperation, keepLocalEvidence, syncEvidence }
}
