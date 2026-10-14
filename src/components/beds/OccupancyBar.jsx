export default function OccupancyBar({ ward, beds }) {
  const used = beds.filter((b) => b.status === 'occupied').length
  const pct = Math.round((used / beds.length) * 100)
  const color = pct >= 85 ? 'bg-danger' : pct >= 60 ? 'bg-warn' : 'bg-brand-500'
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex justify-between text-sm"><span className="font-bold">{ward}</span><span className="text-muted">{used}/{beds.length} · {pct}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-soft"><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
