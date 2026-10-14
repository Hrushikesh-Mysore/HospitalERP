// Green/grey dot showing whether live sync is connected.
import { useLiveStatus } from '../../lib/liveStore'

export default function LiveDot() {
  const live = useLiveStatus()
  return (
    <span className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-muted" title={live ? 'Live updates connected' : 'Live updates offline - refreshing every 5s'}>
      <span className="relative flex h-2 w-2">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      </span>
      <span className="hidden sm:inline">{live ? 'Live' : 'Offline'}</span>
    </span>
  )
}
