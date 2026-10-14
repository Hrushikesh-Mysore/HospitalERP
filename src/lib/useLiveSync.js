import { useEffect, useRef } from 'react'
import { affects, subscribe, useLiveStatus } from './liveStore'

const POLL_MS = 5000

// refetchers: { patients: pts.refetch, beds: beds.refetch, ... } keyed by API resource name.
// Refetches the affected ones on each server event; polls every 5s while the live connection is down.
export function useLiveSync(refetchers) {
  const ref = useRef(refetchers)
  useEffect(() => { ref.current = refetchers })
  const live = useLiveStatus()

  useEffect(() => subscribe((event) => {
    for (const [resource, refetch] of Object.entries(ref.current)) if (affects(event, resource)) refetch()
  }), [])

  useEffect(() => {
    if (live) return
    const t = setInterval(() => Object.values(ref.current).forEach((refetch) => refetch()), POLL_MS)
    return () => clearInterval(t)
  }, [live])
}
