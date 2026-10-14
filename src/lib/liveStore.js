import { useSyncExternalStore } from 'react'

// One shared EventSource for the whole app, opened while anything is subscribed.
const listeners = new Set()
const statusSubs = new Set()
let source = null
let connected = false
let retry = null

// A write to one resource can change data shown from others (e.g. admitting a bed changes patients and stats).
const RELATED = {
  patients: ['patients', 'beds', 'stats', 'appointments', 'emergency'],
  appointments: ['appointments', 'stats'],
  beds: ['beds', 'patients', 'emergency', 'stats'],
  emergency: ['emergency', 'patients', 'beds', 'stats'],
  tokens: ['tokens'],
  prescriptions: ['prescriptions'],
  demo: null, // everything
}
export const affects = (event, resource) => {
  const related = RELATED[event.resource]
  return related === undefined || related === null || related.includes(resource)
}

const setConnected = (value) => {
  if (connected === value) return
  connected = value
  statusSubs.forEach((fn) => fn())
}

function open() {
  if (source || typeof EventSource === 'undefined') return
  source = new EventSource('/api/events')
  source.onopen = () => {
    setConnected(true)
    listeners.forEach((fn) => fn({ type: 'reconnected', resource: 'demo' })) // catch up on anything missed
  }
  source.onmessage = (e) => {
    try { const event = JSON.parse(e.data); listeners.forEach((fn) => fn(event)) } catch { /* ignore malformed frame */ }
  }
  source.onerror = () => {
    setConnected(false)
    if (source.readyState === EventSource.CLOSED) { // browser gave up (e.g. proxy error); retry ourselves
      source = null
      retry = setTimeout(() => { retry = null; if (listeners.size + statusSubs.size) open() }, 5000)
    }
  }
}

function close() {
  if (listeners.size + statusSubs.size) return
  clearTimeout(retry)
  retry = null
  source?.close()
  source = null
  setConnected(false)
}

export function subscribe(fn) {
  listeners.add(fn)
  open()
  return () => { listeners.delete(fn); close() }
}

function subscribeStatus(fn) {
  statusSubs.add(fn)
  open()
  return () => { statusSubs.delete(fn); close() }
}

export const useLiveStatus = () => useSyncExternalStore(subscribeStatus, () => connected, () => false)
