// Displays one prescription.
import { Pill } from 'lucide-react'

export default function PrescriptionCard({ rx }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1">
        <p className="text-sm font-bold">{rx.doctor}</p>
        <p className="text-xs text-muted">{rx.date}</p>
      </div>
      <ul className="space-y-3">
        {rx.medicines.map((m, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Pill size={16} /></span>
            <div className="min-w-0">
              <p className="text-sm font-bold">{m.name} <span className="font-medium text-muted">· {m.dose}</span></p>
              <p className="text-xs text-muted">{m.frequency} · {m.days} {m.days === 1 ? 'day' : 'days'}</p>
            </div>
          </li>
        ))}
      </ul>
      {rx.notes && <p className="mt-3 rounded-xl bg-surface p-3 text-xs text-muted">{rx.notes}</p>}
    </div>
  )
}
