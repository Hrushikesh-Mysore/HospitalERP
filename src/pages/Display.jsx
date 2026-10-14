import { useEffect, useState } from 'react'
import { Maximize2, HeartPulse, Siren } from 'lucide-react'
import LiveDot from '../components/layout/LiveDot'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'

// Public waiting-room board. Shows token codes only, never patient names.
export default function Display() {
  const q = useFetch('/tokens', { anon: true })
  useLiveSync({ tokens: q.refetch })
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())

  const active = (q.data?.doctors ?? []).filter((d) => d.serving || d.waiting.length)
  return (
    <div className="flex min-h-screen flex-col bg-surface p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-2xl font-extrabold lg:text-4xl">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-on-brand lg:h-14 lg:w-14"><HeartPulse /></span>
          Now serving
        </div>
        <div className="flex items-center gap-4">
          <LiveDot />
          <span className="text-2xl font-bold tabular-nums lg:text-4xl">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={fullscreen} aria-label="Toggle full screen" className="rounded-xl p-2 text-muted hover:bg-card"><Maximize2 size={22} /></button>
        </div>
      </header>

      {active.length === 0 ? (
        <div className="grid flex-1 place-items-center text-center"><p className="text-3xl font-bold text-muted">No one is waiting right now</p></div>
      ) : (
        <div className="grid flex-1 content-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {active.map((d) => {
            const s = d.serving
            return (
              <section key={d.id} className="rounded-3xl border border-line bg-card p-6 shadow-sm">
                <p className="text-lg font-bold lg:text-xl">{d.name}</p>
                <p className="mb-4 text-sm text-muted">{d.department}</p>
                {s ? (
                  <div className={`rounded-2xl bg-brand-50 p-5 text-center ${s.status === 'called' ? 'animate-pulse' : ''}`}>
                    <p className="text-6xl font-extrabold tracking-wide text-brand-700 lg:text-7xl">{s.code}</p>
                    <p className="mt-2 text-lg font-semibold">{s.status === 'called' ? 'Please proceed to the room' : 'In consultation'}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-surface p-5 text-center"><p className="text-xl font-semibold text-muted">Next patient shortly</p></div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted">Next:</span>
                  {d.waiting.slice(0, 3).map((t) => <span key={t.id} className="rounded-lg bg-surface px-2.5 py-1 text-lg font-bold">{t.code}</span>)}
                  {d.waiting.length > 3 && <span className="text-sm font-semibold text-muted">+{d.waiting.length - 3}</span>}
                  {d.waiting.length === 0 && <span className="text-sm text-muted">no one waiting</span>}
                </div>
              </section>
            )
          })}
        </div>
      )}
      <footer className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-muted lg:text-base">
        <Siren size={18} /> Emergency cases are always seen first.
      </footer>
    </div>
  )
}
