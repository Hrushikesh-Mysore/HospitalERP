// Shows a list of status changes (from, to, who, when, note).
import { statusLabel } from '../../lib/status'

const when = (iso) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function StatusTimeline({ entries, limit = 6 }) {
  if (entries.length === 0) return <p className="text-sm text-muted">No status changes yet.</p>
  return (
    <ol className="space-y-3 border-l-2 border-brand-100 pl-4">
      {entries.slice(0, limit).map((h, i) => (
        <li key={`${h.at}-${i}`} className="relative">
          <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full border-2 border-card bg-brand-500" />
          <p className="text-sm font-semibold">{statusLabel(h.from)} → {statusLabel(h.to)}</p>
          <p className="text-xs text-muted">{h.by.role}{h.by.name ? ` · ${h.by.name}` : ''} · {when(h.at)} · {h.source}</p>
          {h.note && <p className="mt-0.5 text-xs italic text-muted">“{h.note}”</p>}
        </li>
      ))}
    </ol>
  )
}
