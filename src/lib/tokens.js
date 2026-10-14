// Token colors, labels and wait-time formatting shared by the queue screens.
export const tokenTone = { waiting: 'amber', called: 'blue', 'in-consult': 'brand', done: 'green', skipped: 'gray' }
export const tokenLabel = { waiting: 'Waiting', called: 'Called', 'in-consult': 'In consult', done: 'Done', skipped: 'Skipped' }
export const fmtWait = (min) => (min <= 0 ? 'Next' : `~${min} min`)
export const ago = (iso, now) => {
  const s = Math.max(0, Math.round((now - new Date(iso)) / 1000))
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`
}
// Phones can't reach "localhost", so when reception is on localhost use the LAN address the server reports
export const trackUrl = (code, lanOrigin) => {
  const local = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  return `${local && lanOrigin ? lanOrigin : window.location.origin}/token/${code}`
}
