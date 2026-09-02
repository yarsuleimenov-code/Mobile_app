import { useCallback, useEffect, useRef, useState } from 'react'
import { beginEvidenceSync, finishEvidenceSync, readEvidenceQueue, resolveEvidenceConflict, trackEvidence, writeEvidenceQueue, type EvidenceOperation, type EvidenceSyncItem } from './photoEvidenceDomain'
import type { SyncOutcome } from './prototypeScenarioStore'

export function useEvidenceSync(network: string, outcome: SyncOutcome) {
  const [evidenceQueue, setQueue] = useState(readEvidenceQueue)
  const [evidenceStorageError, setStorageError] = useState(false)
  const queueRef = useRef(evidenceQueue)
  const networkRef = useRef(network)
  networkRef.current = network
  const busy = useRef(false)
  const updateQueue = useCallback((change: (queue: EvidenceSyncItem[]) => EvidenceSyncItem[]) => {
    const next = change(queueRef.current)
    queueRef.current = next
    setQueue(next)
    setStorageError(!writeEvidenceQueue(next))
  }, [])
  useEffect(() => { setStorageError(!writeEvidenceQueue(queueRef.current)) }, [])
  const trackEvidenceOperation = useCallback((operation: EvidenceOperation) => {
    updateQueue((queue) => trackEvidence(queue, operation))
  }, [updateQueue])
  const keepLocalEvidence = useCallback((operationId: string) => {
    updateQueue((queue) => resolveEvidenceConflict(queue, operationId))
  }, [updateQueue])
  const syncEvidence = useCallback(async (operationId?: string) => {
    if (busy.current || networkRef.current === 'offline' || !navigator.onLine) return
    const batch = beginEvidenceSync(queueRef.current, operationId)
    if (!batch.length) return
    busy.current = true
    const ids = new Set(batch.map((item) => item.id))
    updateQueue((queue) => queue.map((item) => ids.has(item.id) ? { ...item, status: 'syncing' } : item))
    await new Promise((resolve) => window.setTimeout(resolve, networkRef.current === 'slow' ? 1800 : 700))
    const result = networkRef.current === 'offline' || !navigator.onLine ? 'offline' : outcome
    updateQueue((queue) => finishEvidenceSync(queue, batch, result))
    busy.current = false
  }, [outcome, updateQueue])
  return { evidenceQueue, evidenceStorageError, trackEvidenceOperation, keepLocalEvidence, syncEvidence }
}
