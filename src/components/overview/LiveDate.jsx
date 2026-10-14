import { formatToday } from '../../lib/dates'

export default function LiveDate() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm font-semibold shadow-sm">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
      </span>
      <span className="text-ok">Live</span>
      <span className="text-muted">·</span>
      <time>{formatToday()}</time>
    </div>
  )
}
