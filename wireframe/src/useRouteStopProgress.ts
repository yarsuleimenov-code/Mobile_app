import { useMemo, useSyncExternalStore } from 'react'
import { parseStopProgress, readStopProgressSnapshot, stopProgressEvent, stopProgressKey } from './routeStopProgress'
import type { SpokeRoute } from './spokeDomain'

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener(stopProgressEvent, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(stopProgressEvent, listener)
  }
}

export function useRouteStopProgress(route: SpokeRoute) {
  const key = stopProgressKey(route)
  const snapshot = useSyncExternalStore(subscribe, () => readStopProgressSnapshot(key))
  return useMemo(() => parseStopProgress(snapshot), [snapshot])
}
