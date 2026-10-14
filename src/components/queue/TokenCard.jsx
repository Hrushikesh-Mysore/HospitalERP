import { fmtWait } from '../../lib/tokens'

function message(t) {
  switch (t.status) {
    case 'waiting':
      return t.position === 1
        ? { tone: 'bg-ok-soft text-ok', title: "You're next!", text: `Please be ready near ${t.doctor}'s room.` }
        : { tone: 'bg-warn-soft text-warn-ink', title: `${t.ahead} ${t.ahead === 1 ? 'person' : 'people'} ahead of you`, text: `Estimated wait ${fmtWait(t.estWaitMin)}` }
    case 'called': return { tone: 'bg-info-soft text-info', title: "It's your turn", text: `Please go to ${t.doctor}'s room now.` }
    case 'in-consult': return { tone: 'bg-brand-50 text-brand-700', title: 'In consultation', text: 'Wishing you good health.' }
    case 'done': return { tone: 'bg-ok-soft text-ok', title: 'All done', text: 'Thank you for visiting.' }
    default: return { tone: 'bg-neutral-soft text-muted', title: 'You were skipped', text: 'Please see the reception desk to rejoin the queue.' }
  }
}

// The patient-facing token: code, status message, position. Used by the public phone view and the Patient role.
export default function TokenCard({ token: t }) {
  const m = message(t)
  return (
    <div className="space-y-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your token</p>
      <p className="text-6xl font-extrabold tracking-wide text-brand-700">{t.code}</p>
      <p className="text-sm text-muted">{t.doctor} · {t.department}</p>
      <div className={`rounded-2xl p-5 ${m.tone} ${t.status === 'called' || t.position === 1 ? 'animate-pulse' : ''}`}>
        <p className="text-2xl font-extrabold">{m.title}</p>
        <p className="mt-1 text-sm font-medium">{m.text}</p>
      </div>
      {t.status === 'waiting' && <p className="text-sm text-muted">Position <b className="text-ink">{t.position}</b> in line · updates automatically</p>}
      <p className="text-xs text-muted">Emergency cases are always seen first and may delay the queue.</p>
    </div>
  )
}
