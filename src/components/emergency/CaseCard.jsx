// One emergency case with priority, wait timer and Assign bed.
import { Clock, BedDouble } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'
import { triage } from '../../lib/status'

const wait = (iso, now) => {
  const s = Math.max(0, Math.floor((now - new Date(iso)) / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return `${h ? `${h}h ` : ''}${String(m).padStart(h ? 2 : 1, '0')}m ${String(s % 60).padStart(2, '0')}s`
}

export default function CaseCard({ c, now, onAssign }) {
  const t = triage[c.priority]
  const critical = c.priority === 1 && c.status === 'waiting'
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border bg-card p-4 pl-6 shadow-sm ${critical ? 'animate-pulse border-danger-line' : 'border-line'}`}>
      <span className={`absolute inset-y-0 left-0 w-2 ${t.bar}`} />
      <div className="min-w-48 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.chip}`}>P{c.priority} · {t.label}</span>
          {c.status === 'admitted' && <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-bold text-info">Admitted</span>}
        </div>
        <p className="mt-1 font-bold">{c.name} <span className="font-normal text-muted">· {c.age} yrs</span></p>
        <p className="text-sm text-muted">{c.complaint}</p>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums text-muted"><Clock size={15} />{wait(c.arrivedAt, now)}</div>
      {c.status === 'waiting' && <Button onClick={() => onAssign(c)}><BedDouble size={16} /> Assign bed</Button>}
    </motion.li>
  )
}
