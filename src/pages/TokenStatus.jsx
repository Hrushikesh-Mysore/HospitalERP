import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import { inputCls } from '../components/ui/Field'
import { useFetch } from '../lib/useFetch'
import { useLiveSync } from '../lib/useLiveSync'
import { fmtWait } from '../lib/tokens'

function CodeForm({ error }) {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) navigate(`/token/${code.trim().toUpperCase()}`) }} className="space-y-3">
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}. Check the code on your slip.</p>}
      <input className={inputCls} placeholder="Token code, e.g. D2-014" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Token code" />
      <Button type="submit" className="w-full">Track my token</Button>
    </form>
  )
}

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

// Patient phone view: opened from the link/QR on the token slip. No sign-in, no layout chrome.
export default function TokenStatus() {
  const { ref } = useParams()
  const q = useFetch(`/tokens/${ref ?? 'none'}`)
  useLiveSync({ tokens: q.refetch })
  const t = ref ? q.data : null
  const m = t && message(t)

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex items-center justify-center gap-2 text-lg font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-on-brand"><HeartPulse size={20} /></span> MediCore
      </div>
      <div className="rounded-3xl border border-line bg-card p-6 text-center shadow-sm">
        {!ref ? (
          <div className="space-y-4"><p className="font-bold">Where am I in the queue?</p><CodeForm /></div>
        ) : q.loading ? (
          <Skeleton className="h-64" />
        ) : !t ? (
          <CodeForm error={q.error ?? 'Token not found'} />
        ) : (
          <div className="space-y-5">
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
        )}
      </div>
    </div>
  )
}
