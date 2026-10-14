// The patient-facing token: code, status message, position (with celebration when just issued).
import { motion, useReducedMotion } from 'framer-motion'
import { Ticket } from 'lucide-react'
import { fmtWait } from '../../lib/tokens'
import Confetti from './Confetti'

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
// celebrate: just issued, so pop the code in with a confetti burst.
export default function TokenCard({ token: t, celebrate = false }) {
  const m = message(t)
  const reduce = useReducedMotion()
  const pop = celebrate && !reduce
  return (
    <div className="relative space-y-5 text-center">
      {celebrate && <Confetti />}
      {pop && (
        <motion.span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-on-brand shadow-lg"
          initial={{ scale: 0, rotate: -40 }} animate={{ scale: [0, 1.25, 1], rotate: [-40, 12, 0] }} transition={{ duration: 0.7, ease: 'easeOut' }}><Ticket size={28} /></motion.span>
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{celebrate ? "You're in line!" : 'Your token'}</p>
      <motion.p className="text-6xl font-extrabold tracking-wide text-brand-700"
        initial={pop ? { scale: 0.2, opacity: 0, y: 24 } : false} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12, delay: pop ? 0.25 : 0 }}>{t.code}</motion.p>
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
